import { useQuery } from "@tanstack/react-query";
import { fetchProjects, formatCurrency } from "@/lib/api";
import { Plus, Edit, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ProjectsManager() {
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Projects</h1>
          <p className="page-description">{projects.length} projects &middot; {projects.filter(p => p.status === "ongoing").length} ongoing</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-card animate-pulse"><div className="h-36 bg-muted rounded" /></div>
            ))
          : projects.map((project) => {
              const progress = Math.round((project.fundsUsed / project.budget) * 100);
              return (
                <div key={project.id} className="admin-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{project.title}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {project.location}
                      </div>
                    </div>
                    <Badge
                      variant={project.status === "ongoing" ? "default" : project.status === "completed" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Budget utilization</span>
                      <span className="font-mono-stat font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(project.fundsUsed)} used</span>
                      <span>{formatCurrency(project.budget)} total</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Edit className="w-3.5 h-3.5" /> Edit Project
                  </Button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
