import json
import requests
import logging
import time
from pathlib import Path
from datetime import datetime, timedelta, UTC
import hashlib

INPUT_JSON = Path("backend/input/raw_input.json")
OUTPUT_JSON = Path("frontend/public/data/live_servers.json")
LOG_FILE = Path("backend/data/live_server_identifier.log")
LOG_FILE.parent.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

def hash_ip_port(ip, port):
    """Generates a SHA256 hash for a given IP and port."""
    return hashlib.sha256(f"{ip}:{port}".encode()).hexdigest()

def mask_ip(ip_address):
    """Masks the last two octets of an IPv4 address."""
    parts = ip_address.split('.')
    if len(parts) == 4:
        # Mask the last two octets
        return f"{parts[0]}.{parts[1]}.XXX.XXX"
    return ip_address # Return as is if not a standard IPv4

def is_server_live(ip, port, max_retries=2):
    url = f"http://{ip}:{port}/api/ps"
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                return "live"
            else:
                logging.warning(f"{ip}:{port} responded with status {resp.status_code}")
                return f"http_error_{resp.status_code}"
        except requests.RequestException as e:
            logging.error(f"Network error for {ip}:{port} (attempt {attempt}): {e}")
        if attempt < max_retries:
            time.sleep(2 ** attempt)
    return "unreachable"

def get_ollama_version(ip, port, max_retries=2):
    url = f"http://{ip}:{port}/api/version"
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("version", "unknown")
            else:
                logging.warning(f"{ip}:{port} /api/version responded with status {resp.status_code}")
        except requests.RequestException as e:
            logging.error(f"Network error for {ip}:{port} /api/version (attempt {attempt}): {e}")
        if attempt < max_retries:
            time.sleep(2 ** attempt)
    return "unreachable"

def get_local_models(ip, port, max_retries=2):
    url = f"http://{ip}:{port}/api/tags"
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                models = []
                for m in data.get("models", []):
                    models.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size": m.get("size")
                    })
                return models
            else:
                logging.warning(f"{ip}:{port} /api/tags responded with status {resp.status_code}")
        except requests.RequestException as e:
            logging.error(f"Network error for {ip}:{port} /api/tags (attempt {attempt}): {e}")
        if attempt < max_retries:
            time.sleep(2 ** attempt)
    return []

def get_running_models(ip, port, max_retries=2):
    url = f"http://{ip}:{port}/api/ps"
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                models = []
                for m in data.get("models", []):
                    models.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size": m.get("size")
                    })
                return models
            else:
                logging.warning(f"{ip}:{port} /api/ps responded with status {resp.status_code}")
        except requests.RequestException as e:
            logging.error(f"Network error for {ip}:{port} /api/ps (attempt {attempt}): {e}")
        if attempt < max_retries:
            time.sleep(2 ** attempt)
    return []

def extract_ip_port(entry):
    ip = entry.get("ip")
    port = entry.get("port", 11434)
    if not ip:
        # Try to extract from 'host' if present
        host = entry.get("host")
        if host and ":" in host:
            ip, port = host.split(":")
    
    city = entry.get("city")
    country = entry.get("country")
    country_name = entry.get("country_name")
    region = entry.get("region")
    latitude = entry.get("latitude")
    longitude = entry.get("longitude")

    return ip, int(port) if port else None, city, country, country_name, region, latitude, longitude

def format_timedelta(td):
    seconds = int(td.total_seconds())
    if seconds < 60: # less than a minute
        return f"{seconds} second{'s' if seconds != 1 else ''}"
    minutes = seconds // 60
    if minutes < 60: # less than an hour
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = minutes // 60
    if hours < 24: # less than a day
        return f"{hours} hour{'s' if hours != 1 else ''}"
    days = hours // 24
    if days < 7: # less than a week
        return f"{days} day{'s' if days != 1 else ''}"
    weeks = days // 7
    return f"{weeks} week{'s' if weeks != 1 else ''}"

def main():
    final_output_servers = {}
    existing_live_servers_map = {}
    now = datetime.now(UTC)

    # Load existing data to preserve first_seen_online and other historical details
    if OUTPUT_JSON.exists():
        try:
            with OUTPUT_JSON.open() as f:
                existing_data = json.load(f)
                if isinstance(existing_data, list): # Handle old list format
                    for server in existing_data:
                        if server.get("ip") and server.get("port"):
                            key = hash_ip_port(server["ip"], server["port"])
                            existing_live_servers_map[key] = server
                else: # Assume it's already dictionary format
                    existing_live_servers_map = existing_data
        except Exception as e:
            logging.error(f"Failed to load existing {OUTPUT_JSON.name}: {e}")

    # Populate final_output_servers with existing data first
    # This ensures that servers not in the current FOFA scan are still present
    final_output_servers.update(existing_live_servers_map)

    # Process each entry from the input FOFA JSON
    with INPUT_JSON.open() as f:
        buffer = ""
        for line in f:
            line = line.strip()
            if not line:
                continue
            buffer += line
            if line.endswith("}"):
                try:
                    entry = json.loads(buffer)
                except Exception as e:
                    logging.error(f"Failed to parse JSON object: {e}")
                    buffer = ""
                    continue
                
                ip, port, city, country, country_name, region, latitude, longitude = extract_ip_port(entry)
                if not ip or not port:
                    buffer = ""
                    continue
                
                server_hash_key = hash_ip_port(ip, port)
                masked_ip = mask_ip(ip)

                # Get existing info or start fresh for current server
                current_server_info = final_output_servers.get(server_hash_key, {})

                # Update common fields from current scan
                current_server_info["port"] = int(port)
                current_server_info["city"] = city
                current_server_info["country"] = country
                current_server_info["country_name"] = country_name
                current_server_info["region"] = region
                current_server_info["latitude"] = latitude
                current_server_info["longitude"] = longitude
                current_server_info["ip"] = masked_ip
                current_server_info["last_observed"] = now.isoformat() # Always update last_observed
                current_server_info["last_updated"] = now.isoformat() # Always update last_updated

                # Determine status and update live-specific fields
                server_status = is_server_live(ip, port)
                current_server_info["status"] = server_status

                if server_status == "live":
                    current_server_info["version"] = get_ollama_version(ip, port)
                    current_server_info["local"] = get_local_models(ip, port)
                    current_server_info["running"] = get_running_models(ip, port)
                    
                    if "first_seen_online" not in current_server_info or not current_server_info["first_seen_online"]:
                        current_server_info["first_seen_online"] = now.isoformat()
                else: # Server is dead or unreachable
                    # Set defaults if these fields are not present (e.g., for newly discovered dead servers)
                    current_server_info.setdefault("version", "unknown")
                    current_server_info.setdefault("local", [])
                    current_server_info.setdefault("running", [])
                    current_server_info.setdefault("first_seen_online", None)

                # Calculate and add 'age' field
                if current_server_info.get("first_seen_online"):
                    try:
                        dt_first_seen = datetime.fromisoformat(current_server_info["first_seen_online"])
                        age_td = now - dt_first_seen
                        current_server_info["age"] = format_timedelta(age_td)
                    except ValueError as e:
                        logging.error(f"Error parsing timestamp {current_server_info['first_seen_online']}: {e}")
                        current_server_info["age"] = "unknown"
                else:
                    current_server_info["age"] = "N/A" # For newly observed dead servers that were never seen live

                logging.info(f"Processed {current_server_info['ip']}:{port} (status: {current_server_info['status']}, v{current_server_info.get('version', 'N/A')}, age: {current_server_info.get('age', 'N/A')})")
                
                final_output_servers[server_hash_key] = current_server_info # Store in the final dictionary
                buffer = ""
    
    # Write the complete updated map to OUTPUT_JSON
    OUTPUT_JSON.write_text(json.dumps(final_output_servers, indent=2))
    logging.info(f"Scan complete. {len(final_output_servers)} servers saved to {OUTPUT_JSON.name}")

if __name__ == "__main__":
    main() 