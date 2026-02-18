import { motion } from "framer-motion";
import { useState } from "react";

const categories = ["All", "Events", "Beneficiaries", "Volunteers", "Field Visits"];

const mockPhotos = [
  { id: "1", caption: "Medical camp in Sundarbans", category: "Events" },
  { id: "2", caption: "Students receiving school supplies", category: "Beneficiaries" },
  { id: "3", caption: "Volunteer orientation 2024", category: "Volunteers" },
  { id: "4", caption: "Village survey in Bihar", category: "Field Visits" },
  { id: "5", caption: "Women empowerment workshop", category: "Events" },
  { id: "6", caption: "Food distribution drive", category: "Events" },
  { id: "7", caption: "First graduates celebrate", category: "Beneficiaries" },
  { id: "8", caption: "Field team at work", category: "Field Visits" },
  { id: "9", caption: "Volunteer camp setup", category: "Volunteers" },
];

export default function GalleryPage() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? mockPhotos : mockPhotos.filter((p) => p.category === active);

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Gallery</h1>
          <p className="text-muted-foreground">Moments from the field — proof of impact</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  active === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-[4/3] bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
              >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Photo placeholder
                </div>
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-background text-sm font-medium">{photo.caption}</p>
                    <p className="text-background/70 text-xs">{photo.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
