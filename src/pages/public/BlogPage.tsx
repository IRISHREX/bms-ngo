import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, formatDate } from "@/lib/api";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import CoverInitialsTile from "@/components/CoverInitialsTile";
import { useI18n } from "@/lib/i18n";

export default function BlogPage() {
  const { t } = useI18n();
  const { data: posts = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const published = posts.filter((post) => post.status === "published");

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Helper function to chunk text by word count (approx 500 words per page)
  const getPages = (content: string, wordsPerPage = 500) => {
    const words = content.split(/\s+/);
    const pages = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(" "));
    }
    return pages.length ? pages : [""];
  };

  const pages = selectedPost ? getPages(selectedPost.content) : [];

  const handleOpenReader = (post: any) => {
    setSelectedPost(post);
    setCurrentPage(0);
  };

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("blog.title")}</h1>
          <p className="text-muted-foreground">{t("blog.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {published.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="admin-card space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="aspect-video w-full object-cover rounded-md" />
                ) : (
                  <CoverInitialsTile title={post.title} />
                )}
                <div className="flex gap-2">
                  {post.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                  <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleOpenReader(post)}>
                    <BookOpen className="h-4 w-4" />
                    Read Mode
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
          {published.length === 0 && (
            <p className="text-center text-muted-foreground py-12">{t("blog.empty")}</p>
          )}
        </div>
      </section>

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none border-0 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto bg-background text-foreground">
            {selectedPost && (
              <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 h-full flex flex-col">
                <div className="mb-8">
                  <Badge variant="secondary" className="mb-4 text-sm px-3 py-1 bg-primary/10 text-primary">
                    {selectedPost.tags?.[0] || 'Article'}
                  </Badge>
                  <DialogTitle className="text-3xl md:text-5xl font-bold leading-tight mb-4 font-serif">
                    {selectedPost.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground flex items-center gap-4 border-b pb-6">
                    <span>Published on {formatDate(selectedPost.createdAt)}</span>
                    <span className="hidden md:inline">•</span>
                    <span>Page {currentPage + 1} of {pages.length}</span>
                  </DialogDescription>
                </div>

                {selectedPost.coverImage && currentPage === 0 && (
                  <div className="mb-10 rounded-xl overflow-hidden shadow-md max-h-[60vh]">
                    <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none flex-1 font-serif leading-relaxed text-foreground/90">
                  {pages[currentPage].split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-6">{paragraph}</p>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pages.length > 1 && (
                  <div className="mt-12 pt-6 border-t flex items-center justify-between pb-8">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentPage + 1} / {pages.length}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                      disabled={currentPage === pages.length - 1}
                      className="gap-2"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
