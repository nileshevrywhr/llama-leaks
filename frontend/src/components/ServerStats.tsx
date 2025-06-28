
import React from 'react';
import AnimatedCounter from './AnimatedCounter';

const ServerStats = () => {
  const stats = [
    {
      value: 259237,
      label: "Total Servers",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20"
    },
    {
      value: 1937,
      label: "Valid Servers",
      color: "text-green-400", 
      bgColor: "bg-green-500/10 border-green-500/20"
    },
    {
      value: 126,
      label: "New Today",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10 border-orange-500/20"
    },
    {
      value: 4,
      label: "Latest Find",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10 border-pink-500/20",
      suffix: " minutes ago"
    }
  ];

  return (
    <section className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative p-6 rounded-lg border backdrop-blur-sm ${stat.bgColor} transition-all duration-300 hover:scale-105`}
          >
            <div className="text-center">
              <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-2`}>
                <AnimatedCounter 
                  target={stat.value} 
                  duration={2000 + (index * 300)}
                />
                {stat.suffix && (
                  <span className="text-sm font-normal">{stat.suffix}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Real-time data from internet-wide scans. Numbers updated hourly.
        </p>
      </div>
    </section>
  );
};

export default ServerStats;
