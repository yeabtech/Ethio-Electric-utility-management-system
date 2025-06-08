"use client";

import { useState, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function NewsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const router = useRouter();

  const { startUpload } = useUploadThing("newsImage");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/news");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to fetch news articles");
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news article?")) {
      return;
    }

    try {
      const response = await fetch(`/api/news?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete news article");
      }

      toast.success("News article deleted successfully");
      fetchNews(); // Refresh the news list
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Failed to delete news article");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = "";
      
      if (image) {
        const uploadedFiles = await startUpload([image]);
        if (uploadedFiles) {
          imageUrl = uploadedFiles[0].url;
        }
      }

      const response = await fetch("/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content: content.replace(/\n/g, "<br>"), // Convert newlines to <br> tags
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create news article");
      }

      toast.success("News article created successfully!");
      router.refresh();
      
      // Reset form
      setTitle("");
      setContent("");
      setImage(null);
      
      // Refresh news list
      fetchNews();
    } catch (error) {
      toast.error("Failed to create news article");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-black">News Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create News Form */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 text-black">Create News Article</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter news title"
                required
                className="w-full text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter news content"
                required
                className="w-full min-h-[200px] text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full text-black"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create News Article"}
            </Button>
          </form>
        </Card>

        {/* News List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-black">News Articles</h2>
          
          {isLoadingNews ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {news.map((article) => (
                <Card key={article.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold text-black">
                      {article.title}
                    </CardTitle>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {article.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div
                      className="prose max-w-none text-black text-sm line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Published on: {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {news.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No news articles found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
