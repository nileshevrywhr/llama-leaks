import json
import requests
import logging
import time
import asyncio
import aiohttp
from pathlib import Path
from datetime import datetime, timedelta, UTC
import hashlib
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

OUTPUT_JSON = Path("frontend/public/data/live_servers.json")
LOG_FILE = Path("backend/data/live_server_identifier.log")
LOG_FILE.parent.mkdir(exist_ok=True)

# Thread-safe logging
log_lock = threading.Lock()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
    ]
)

def thread_safe_log(level, message):
    with log_lock:
        logging.log(level, message)

def hash_ip_port(ip, port):
    """Generates a SHA256 hash for a given IP and port."""
    return hashlib.sha256(f"{ip}:{port}".encode()).hexdigest()

def mask_ip(ip_address):
    """Masks the last two octets of an IPv4 address."""
    parts = ip_address.split('.')
    if len(parts) == 4:
        return f"{parts[0]}.{parts[1]}.XXX.XXX"
    return ip_address

# Async version for better performance
async def check_server_async(session, ip, port, max_retries=2):
    """Async version of server checking with all API calls in parallel"""
    urls = {
        'ps': f"http://{ip}:{port}/api/ps",
        'version': f"http://{ip}:{port}/api/version", 
        'tags': f"http://{ip}:{port}/api/tags"
    }
    
    results = {
        'status': 'unreachable',
        'version': 'unknown',
        'local': [],
        'running': []
    }
    
    for attempt in range(max_retries):
        try:
            # Check if server is live first
            async with session.get(urls['ps'], timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    results['status'] = 'live'
                    ps_data = await resp.json()
                    
                    # Extract running models
                    models = []
                    for m in ps_data.get("models", []):
                        models.append({
                            "name": m.get("name"),
                            "model": m.get("model"),
                            "size": m.get("size")
                        })
                    results['running'] = models
                    
                    # Now get version and local models in parallel
                    tasks = []
                    
                    # Version task
                    async def get_version():
                        try:
                            async with session.get(urls['version'], timeout=aiohttp.ClientTimeout(total=3)) as v_resp:
                                if v_resp.status == 200:
                                    v_data = await v_resp.json()
                                    return v_data.get("version", "unknown")
                        except:
                            pass
                        return "unknown"
                    
                    # Local models task
                    async def get_local():
                        try:
                            async with session.get(urls['tags'], timeout=aiohttp.ClientTimeout(total=3)) as t_resp:
                                if t_resp.status == 200:
                                    t_data = await t_resp.json()
                                    models = []
                                    for m in t_data.get("models", []):
                                        models.append({
                                            "name": m.get("name"),
                                            "model": m.get("model"),
                                            "size": m.get("size")
                                        })
                                    return models
                        except:
                            pass
                        return []
                    
                    # Run version and tags requests in parallel
                    version_result, local_result = await asyncio.gather(
                        get_version(), 
                        get_local(),
                        return_exceptions=True
                    )
                    
                    if not isinstance(version_result, Exception):
                        results['version'] = version_result
                    if not isinstance(local_result, Exception):
                        results['local'] = local_result
                    
                    return results
                    
                else:
                    results['status'] = f"http_error_{resp.status}"
                    return results
                    
        except asyncio.TimeoutError:
            thread_safe_log(logging.WARNING, f"Timeout for {mask_ip(ip)}:{port} (attempt {attempt + 1})")
        except Exception as e:
            thread_safe_log(logging.ERROR, f"Error for {mask_ip(ip)}:{port} (attempt {attempt + 1}): {e}")
        
        if attempt < max_retries - 1:
            await asyncio.sleep(0.5 * (2 ** attempt))  # Shorter backoff
    
    return results

# Synchronous version using ThreadPoolExecutor for backwards compatibility
def check_server_sync(ip, port, max_retries=2):
    """Optimized synchronous version with shorter timeouts"""
    session = requests.Session()
    session.headers.update({'Connection': 'close'})  # Prevent connection reuse issues
    
    results = {
        'status': 'unreachable',
        'version': 'unknown',
        'local': [],
        'running': []
    }
    
    for attempt in range(max_retries):
        try:
            # Check if server is live with shorter timeout
            resp = session.get(f"http://{ip}:{port}/api/ps", timeout=2)
            if resp.status_code == 200:
                results['status'] = 'live'
                ps_data = resp.json()
                
                # Extract running models
                models = []
                for m in ps_data.get("models", []):
                    models.append({
                        "name": m.get("name"),
                        "model": m.get("model"),
                        "size": m.get("size")
                    })
                results['running'] = models
                
                # Get version and local models quickly
                try:
                    v_resp = session.get(f"http://{ip}:{port}/api/version", timeout=2)
                    if v_resp.status_code == 200:
                        v_data = v_resp.json()
                        results['version'] = v_data.get("version", "unknown")
                except:
                    pass
                
                try:
                    t_resp = session.get(f"http://{ip}:{port}/api/tags", timeout=2)
                    if t_resp.status_code == 200:
                        t_data = t_resp.json()
                        models = []
                        for m in t_data.get("models", []):
                            models.append({
                                "name": m.get("name"),
                                "model": m.get("model"),
                                "size": m.get("size")
                            })
                        results['local'] = models
                except:
                    pass
                
                return results
            else:
                results['status'] = f"http_error_{resp.status_code}"
                return results
                
        except requests.RequestException as e:
            thread_safe_log(logging.ERROR, f"Network error for {mask_ip(ip)}:{port} (attempt {attempt + 1}): {e}")
        
        if attempt < max_retries - 1:
            time.sleep(0.5 * (2 ** attempt))  # Shorter backoff
    
    session.close()
    return results

def extract_ip_port(entry):
    ip = entry.get("ip")
    port = entry.get("port", 11434)
    if not ip:
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
    if seconds < 60:
        return f"{seconds} second{'s' if seconds != 1 else ''}"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''}"
    days = hours // 24
    if days < 7:
        return f"{days} day{'s' if days != 1 else ''}"
    weeks = days // 7
    return f"{weeks} week{'s' if weeks != 1 else ''}"

async def process_servers_async(servers_to_check, final_output_servers, now):
    """Process servers using async HTTP requests"""
    connector = aiohttp.TCPConnector(
        limit=100,  # Total connection limit
        limit_per_host=10,  # Per-host connection limit
        ttl_dns_cache=300,  # DNS cache TTL
        use_dns_cache=True,
    )
    
    timeout = aiohttp.ClientTimeout(total=5)  # Overall timeout per request
    
    async with aiohttp.ClientSession(
        connector=connector,
        timeout=timeout,
        headers={'Connection': 'close'}
    ) as session:
        
        semaphore = asyncio.Semaphore(50)  # Limit concurrent requests
        
        async def process_single_server(server_data):
            async with semaphore:
                ip, port, city, country, country_name, region, latitude, longitude = server_data
                server_hash_key = hash_ip_port(ip, port)
                masked_ip = mask_ip(ip)
                
                # Get existing info or start fresh
                current_server_info = final_output_servers.get(server_hash_key, {})
                
                # Update common fields
                current_server_info.update({
                    "port": int(port),
                    "city": city,
                    "country": country,
                    "country_name": country_name,
                    "region": region,
                    "latitude": latitude,
                    "longitude": longitude,
                    "ip": masked_ip,
                    "last_observed": now.isoformat()
                })
                
                # Set first_seen_online for new servers
                is_new_server = server_hash_key not in final_output_servers
                if is_new_server:
                    current_server_info["first_seen_online"] = now.isoformat()
                
                # Check server status
                check_result = await check_server_async(session, ip, port)
                current_server_info.update(check_result)
                
                # Update first_seen_online for newly live servers
                if check_result['status'] == 'live' and not current_server_info.get("first_seen_online"):
                    current_server_info["first_seen_online"] = now.isoformat()
                
                # Calculate age
                if current_server_info.get("first_seen_online"):
                    try:
                        dt_first_seen = datetime.fromisoformat(current_server_info["first_seen_online"])
                        age_td = now - dt_first_seen
                        current_server_info["age"] = format_timedelta(age_td)
                    except ValueError as e:
                        thread_safe_log(logging.ERROR, f"Error parsing timestamp: {e}")
                        current_server_info["age"] = "unknown"
                else:
                    current_server_info["age"] = "N/A"
                
                # Log live servers
                if check_result['status'] == 'live':
                    thread_safe_log(logging.INFO, f"Live server found: {masked_ip}:{port}")
                    local_models = current_server_info.get("local", [])
                    if local_models:
                        for idx, model in enumerate(local_models[:3]):  # Log first 3 models
                            name = model.get("name", "N/A")
                            size = model.get("size", "N/A")
                            if isinstance(size, (int, float)):
                                size_gb = size / (1024**3)
                                thread_safe_log(logging.INFO, f"  {idx+1}. {name} ({size_gb:.2f} GB)")
                
                return server_hash_key, current_server_info
        
        # Process all servers concurrently
        tasks = [process_single_server(server_data) for server_data in servers_to_check]
        
        # Use tqdm for progress tracking
        results = []
        for task in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Checking servers"):
            result = await task
            results.append(result)
        
        return results

def process_servers_threaded(servers_to_check, final_output_servers, now, max_workers=50):
    """Process servers using ThreadPoolExecutor for CPU-bound work"""
    results = []
    
    def process_single_server(server_data):
        ip, port, city, country, country_name, region, latitude, longitude = server_data
        server_hash_key = hash_ip_port(ip, port)
        masked_ip = mask_ip(ip)
        
        # Get existing info or start fresh
        current_server_info = final_output_servers.get(server_hash_key, {})
        
        # Update common fields
        current_server_info.update({
            "port": int(port),
            "city": city,
            "country": country,
            "country_name": country_name,
            "region": region,
            "latitude": latitude,
            "longitude": longitude,
            "ip": masked_ip,
            "last_observed": now.isoformat()
        })
        
        # Set first_seen_online for new servers
        is_new_server = server_hash_key not in final_output_servers
        if is_new_server:
            current_server_info["first_seen_online"] = now.isoformat()
        
        # Check server status
        check_result = check_server_sync(ip, port, max_retries=1)  # Reduced retries
        current_server_info.update(check_result)
        
        # Update first_seen_online for newly live servers
        if check_result['status'] == 'live' and not current_server_info.get("first_seen_online"):
            current_server_info["first_seen_online"] = now.isoformat()
        
        # Calculate age
        if current_server_info.get("first_seen_online"):
            try:
                dt_first_seen = datetime.fromisoformat(current_server_info["first_seen_online"])
                age_td = now - dt_first_seen
                current_server_info["age"] = format_timedelta(age_td)
            except ValueError as e:
                thread_safe_log(logging.ERROR, f"Error parsing timestamp: {e}")
                current_server_info["age"] = "unknown"
        else:
            current_server_info["age"] = "N/A"
        
        # Log live servers
        if check_result['status'] == 'live':
            thread_safe_log(logging.INFO, f"Live server found: {masked_ip}:{port}")
        
        return server_hash_key, current_server_info
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_server = {executor.submit(process_single_server, server_data): server_data 
                           for server_data in servers_to_check}
        
        # Process completed tasks with progress bar
        for future in tqdm(as_completed(future_to_server), total=len(servers_to_check), desc="Checking servers"):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                server_data = future_to_server[future]
                thread_safe_log(logging.ERROR, f"Error processing server {server_data[0]}:{server_data[1]}: {e}")
    
    return results

def main():
    final_output_servers = {}
    existing_live_servers_map = {}
    now = datetime.now(UTC)

    # Load existing data
    if OUTPUT_JSON.exists():
        try:
            with OUTPUT_JSON.open() as f:
                existing_data = json.load(f)
                if isinstance(existing_data, list):
                    for server in existing_data:
                        if server.get("ip") and server.get("port"):
                            key = hash_ip_port(server["ip"], server["port"])
                            existing_live_servers_map[key] = server
                else:
                    existing_live_servers_map = existing_data
        except Exception as e:
            logging.error(f"Failed to load existing {OUTPUT_JSON.name}: {e}")

    # Populate final_output_servers with existing data
    final_output_servers.update(existing_live_servers_map)

    # Collect all servers to check
    input_files = list(Path("backend/input/").glob("FOFA_*.json"))
    if not input_files:
        logging.info("No FOFA_*.json files found in backend/input/. Exiting.")
        return

    servers_to_check = []
    
    print("Collecting servers from input files...")
    for input_file in input_files:
        logging.info(f"Processing file: {input_file.name}")
        with input_file.open() as f:
            buffer = ""
            for line in f:
                line = line.strip()
                if not line:
                    continue
                buffer += line
                if line.endswith("}"):
                    try:
                        entry = json.loads(buffer)
                        ip, port, city, country, country_name, region, latitude, longitude = extract_ip_port(entry)
                        if ip and port:
                            servers_to_check.append((ip, port, city, country, country_name, region, latitude, longitude))
                    except Exception as e:
                        logging.error(f"Failed to parse JSON object: {e}")
                    buffer = ""

    print(f"Found {len(servers_to_check)} servers to check")
    
    # Choose processing method
    use_async = True  # Set to False to use threaded approach
    
    if use_async:
        print("Using async processing...")
        # Use async processing
        results = asyncio.run(process_servers_async(servers_to_check, final_output_servers, now))
    else:
        print("Using threaded processing...")
        # Use threaded processing
        results = process_servers_threaded(servers_to_check, final_output_servers, now)
    
    # Update final_output_servers with results
    for server_hash_key, server_info in results:
        final_output_servers[server_hash_key] = server_info
    
    # Write results
    OUTPUT_JSON.write_text(json.dumps(final_output_servers, indent=2))
    logging.info(f"Scan complete. {len(final_output_servers)} servers saved to {OUTPUT_JSON.name}")

if __name__ == "__main__":
    main()