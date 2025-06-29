import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Medal,
  Shield,
  Eye,
  AlertTriangle,
  Github,
  ExternalLink,
  Clock,
  Target
} from "lucide-react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Footer from "@/components/Footer";

interface SecurityHero {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  totalSubmissions: number;
  recentSubmissions: number;
  lastSubmission: string;
  favoriteTarget: string;
  specialTitle: string;
  trophyEmoji: string;
  reposAffected: number;
  openIssues: number;
  closedIssues: number;
  score: number;
}

const SecurityHeroes = () => {
  const [heroes, setHeroes] = useState<SecurityHero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading heroes data
    setTimeout(() => {
      setHeroes([
        {
          id: "1",
          name: "Ollama Hunter #327",
          avatar: "OH",
          rank: 1,
          totalSubmissions: 127,
          recentSubmissions: 23,
          lastSubmission: "2 hours ago",
          favoriteTarget: "Ollama API",
          specialTitle: "Ultimate Ollama Snitch",
          trophyEmoji: "🏆",
          reposAffected: 89,
          openIssues: 12,
          closedIssues: 115,
          score: 3892
        },
        {
          id: "2", 
          name: "Server Scout #891",
          avatar: "SS",
          rank: 2,
          totalSubmissions: 84,
          recentSubmissions: 15,
          lastSubmission: "6 hours ago",
          favoriteTarget: "AI Endpoints",
          specialTitle: "Master AI Guardian",
          trophyEmoji: "🥇",
          reposAffected: 67,
          openIssues: 8,
          closedIssues: 76,
          score: 2156
        },
        {
          id: "3",
          name: "Exposure Expert #442",
          avatar: "EE", 
          rank: 3,
          totalSubmissions: 61,
          recentSubmissions: 9,
          lastSubmission: "1 day ago",
          favoriteTarget: "LLM Servers",
          specialTitle: "Elite Model Finder",
          trophyEmoji: "🥈",
          reposAffected: 45,
          openIssues: 5,
          closedIssues: 56,
          score: 1847
        },
        {
          id: "4",
          name: "API Detective #156",
          avatar: "AD",
          rank: 4,
          totalSubmissions: 38,
          recentSubmissions: 7,
          lastSubmission: "3 days ago", 
          favoriteTarget: "REST APIs",
          specialTitle: "Security Specialist",
          trophyEmoji: "🥉",
          reposAffected: 32,
          openIssues: 3,
          closedIssues: 35,
          score: 1203
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500";
      case 2: return "bg-gray-400"; 
      case 3: return "bg-amber-600";
      default: return "bg-blue-500";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: 
      case 3: return <Medal className="h-5 w-5 text-gray-500" />;
      default: return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <WarningBanner />
        
        <div className="pt-[88px] container py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Security Heroes Leaderboard <Trophy className="inline h-12 w-12 text-yellow-500" />
              </h1>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Hall of Fame for Security Heroes
              </p>
              <p className="text-muted-foreground italic">
                Because sometimes being a snitch saves the day! 🕵️
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading heroes...</p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Browser-like Header */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-700 rounded px-3 py-1 text-sm text-muted-foreground">
          https://ollamawall.com/security-heroes
        </div>
      </div>

      <Header />
      <WarningBanner />
      
      <div className="pt-[88px] container py-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Security Heroes Leaderboard <Trophy className="inline h-12 w-12 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              Hall of Fame for Security Heroes
            </p>
            <p className="text-muted-foreground text-lg italic max-w-2xl mx-auto">
              Because sometimes being a snitch saves the day! 🕵️
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>These legends have helped developers avoid embarrassing (and expensive) conversations with their</p>
            <p>bosses by reporting exposed API keys and vulnerable servers.</p>
          </div>

          <Button 
            variant="outline" 
            size="lg"
            className="gap-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Want to join the leaderboard? Start submitting GitHub issues for exposed keys! 
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Heroes Grid */}
        <div className="grid gap-8 max-w-4xl mx-auto">
          {heroes.map((hero, index) => (
            <Card 
              key={hero.id}
              className={`
                relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2
                ${hero.rank <= 3 ? 'border-2' : 'border'}
                ${hero.rank === 1 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50/40 to-orange-50/40 dark:from-yellow-950/20 dark:to-orange-950/20' : ''}
                ${hero.rank === 2 ? 'border-gray-400 bg-gradient-to-br from-gray-50/40 to-slate-50/40 dark:from-gray-950/20 dark:to-slate-950/20' : ''}
                ${hero.rank === 3 ? 'border-amber-600 bg-gradient-to-br from-amber-50/40 to-yellow-50/40 dark:from-amber-950/20 dark:to-yellow-950/20' : ''}
                shadow-lg
              `}
            >
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Medal & Avatar */}
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-8 ${getBadgeColor(hero.rank)} rounded`}></div>
                      <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg
                        ${hero.rank === 1 ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 
                          hero.rank === 2 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                          hero.rank === 3 ? 'bg-gradient-to-br from-blue-700 to-indigo-800' :
                          'bg-gradient-to-br from-gray-500 to-gray-600'}
                      `}>
                        {hero.avatar}
                      </div>
                    </div>
                    
                    {/* Hero Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-bold">
                          {hero.name}
                        </CardTitle>
                        <span className="text-2xl">{hero.trophyEmoji}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Last submission: {hero.lastSubmission}
                      </div>
                      <div className="text-muted-foreground">
                        Favorite: {hero.favoriteTarget}
                      </div>
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {hero.totalSubmissions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      submissions
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {hero.score}
                    </div>
                  </div>
                </div>
                
                {/* Special Title */}
                <div className="flex items-center justify-center mt-4">
                  <Badge 
                    variant="secondary" 
                    className={`
                      text-sm py-2 px-4 font-medium
                      ${hero.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                        hero.rank === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                        hero.rank === 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                    `}
                  >
                    {getRankIcon(hero.rank)}
                    <span className="ml-2">{hero.specialTitle}</span>
                    {getRankIcon(hero.rank)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-xl font-bold text-muted-foreground">
                      Repos affected: {hero.reposAffected}
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xl font-bold">
                      <span className="text-green-600">Open: {hero.openIssues}</span>
                      <span className="text-muted-foreground mx-2">|</span>
                      <span className="text-gray-600">Closed: {hero.closedIssues}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center space-y-4 pt-12 border-t">
          <h3 className="text-xl font-semibold">
            Want to join the leaderboard? Start submitting GitHub issues for exposed keys! 🚀
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            This leaderboard tracks security researchers who help protect the community by responsibly reporting 
            exposed Ollama servers and API vulnerabilities. Every report helps make the internet safer.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SecurityHeroes;