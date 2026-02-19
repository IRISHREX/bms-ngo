import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, formatDate } from "@/lib/api";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function BlogPage() {
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const published = posts.filter((p) => p.status === "published");

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Stories & Blog</h1>
          <p className="text-muted-foreground">Real stories from the ground — every life we touch matters</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {published.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="admin-card space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="aspect-video w-full object-cover rounded-md" />
                ) : (
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
                    Cover Image
                  </div>
                )}
                <div className="flex gap-2">
                  {post.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
              </motion.article>
            ))}
          </div>
          {published.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No blog posts published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
