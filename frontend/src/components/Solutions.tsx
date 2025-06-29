import { Shield, Server, ShieldCheck, Activity, Key, Gauge, Search, Wifi } from "lucide-react";

const Solutions = () => {
  return (
    <section id="solutions" className="container py-24 scroll-mt-24">
      <div className="p-8 bg-gradient-to-br from-blue-500/5 to-primary/5 border border-blue-500/20 rounded-xl">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-blue-600 dark:text-blue-400">
              How to Actually Secure Your Server
            </h2>
            <div className="text-muted-foreground text-base max-w-3xl mx-auto space-y-1">
              <p className="text-center">
                Stop being part of the problem.
              </p>
              <p className="text-center">
                Here are the security measures you should implement right now:
              </p>
            </div>
          </div>
          
          {/* Quick Fixes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">Quick Fixes (Do These Now)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Bind to localhost only</div>
                    <div className="text-xs text-muted-foreground">(127.0.0.1:11434)</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Use reverse proxy</div>
                    <div className="text-xs text-muted-foreground">with authentication</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Set up firewall rules</div>
                    <div className="text-xs text-muted-foreground">Block unnecessary ports</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Monitor access logs</div>
                    <div className="text-xs text-muted-foreground">Check regularly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proper Solutions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">Long-Term Solutions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">API key authentication</div>
                    <div className="text-xs text-muted-foreground">Secure your endpoints</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Use VPN for remote access</div>
                    <div className="text-xs text-muted-foreground">Secure tunneling</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Set up rate limiting</div>
                    <div className="text-xs text-muted-foreground">Control request frequency</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Regular security audits</div>
                    <div className="text-xs text-muted-foreground">Stay vigilant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-blue-500/20">
            <p className="font-medium text-center">🛡️ Security is not optional in production environments.</p>
            <p className="text-center">Implement these measures before your server becomes another statistic on this wall.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;