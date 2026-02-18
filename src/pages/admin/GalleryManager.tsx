import { Upload, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const categories = ["All", "Events", "Beneficiaries", "Volunteers", "Field Visits"];

const mockGalleryItems = [
  { id: "1", caption: "Medical camp in Sundarbans", category: "Events" },
  { id: "2", caption: "Students receiving books", category: "Beneficiaries" },
  { id: "3", caption: "Volunteer orientation day", category: "Volunteers" },
  { id: "4", caption: "Village survey - Bihar", category: "Field Visits" },
  { id: "5", caption: "Food distribution drive", category: "Events" },
  { id: "6", caption: "Women empowerment workshop", category: "Events" },
];

export default function GalleryManager() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? mockGalleryItems : mockGalleryItems.filter(g => g.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Gallery Manager</h1>
          <p className="page-description">{mockGalleryItems.length} photos across {categories.length - 1} categories</p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" /> Upload Photos
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="admin-card p-0 overflow-hidden group">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Photo placeholder</span>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-medium">{item.caption}</p>
              <Badge variant="outline" className="text-xs">{item.category}</Badge>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button className="border-2 border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-8 h-8" />
          <span className="text-sm">Add Photos</span>
        </button>
      </div>
    </div>
  );
}
