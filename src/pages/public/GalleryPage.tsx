import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGallery } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function GalleryPage() {
  const { t } = useI18n();
  const categories = [
    { label: t("gallery.all"), value: "all" },
    { label: t("gallery.events"), value: "events" },
    { label: t("gallery.beneficiaries"), value: "beneficiaries" },
    { label: t("gallery.volunteers"), value: "volunteers" },
    { label: t("gallery.fieldVisits"), value: "field-visits" },
  ] as const;

  const categoryLabel = (value: string) => categories.find((category) => category.value === value)?.label || value;

  const [active, setActive] = useState("all");
  const { data: photos = [], isLoading } = useQuery({ queryKey: ["gallery"], queryFn: fetchGallery });
  const filtered = active === "all" ? photos : photos.filter((photo) => photo.category === active);

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("gallery.title")}</h1>
          <p className="text-muted-foreground">{t("gallery.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActive(category.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  active === category.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
            ))}

            {!isLoading && filtered.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="aspect-[4/3] bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
              >
                <img src={photo.url} alt={photo.caption || "Gallery image"} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="text-background text-sm font-medium">{photo.caption || t("gallery.untitled")}</p>
                    <p className="text-background/70 text-xs">{categoryLabel(photo.category)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">{t("gallery.noPhotos")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
