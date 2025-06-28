import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Verification = {
  status: 'pending' | 'approved' | 'rejected' | 'not_verified'
  rejectionReason?: string | null
  createdAt: string
}

interface NewsArticle {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

interface HomePageProps {
  verification: Verification | null
  loading: boolean
}

export default function HomePage({ verification, loading }: HomePageProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }
        const data = await response.json()
        setNews(data)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoadingNews(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    )
  }

  const isVerified = verification?.status === 'approved'
  const isPending = verification?.status === 'pending'
  const isRejected = verification?.status === 'rejected'

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-background">
      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Welcome Section - Shown to all users */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Welcome to EEUMS Dashboard</h1>

          
          {!isVerified && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-red-500 dark:text-red-400" />
                <h3 className="font-medium text-red-700 dark:text-red-300">Account Verification Required</h3>
              </div>
              <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                {isPending ? 
                  "Your verification is pending approval. Some features are limited until verification is complete." :
                isRejected ?
                  `Your verification was rejected: ${verification.rejectionReason || 'No reason specified'}. Please resubmit.` :
                  "Please verify your account to access all services and features."}
              </p>
              <Button 
                variant="secondary" 
                className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800/50 dark:hover:bg-red-800 dark:text-red-200" 
                onClick={() => router.push('/customer/verify')}
              >
                {isRejected ? 'Resubmit Verification' : 'Verify Account'}
              </Button>
            </div>
          )}
        </div>

        {/* News Section - Shown to all users */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">Latest News</h2>
          {loadingNews ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
          ) : news.length > 0 ? (
            <div className="grid gap-4">
              {news.map((article) => (
                <Card key={article.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-foreground">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div
                      className="prose max-w-none text-foreground text-sm"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Published on: {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No news articles available at the moment.</p>
          )}
        </div>

        

        
      </main>
    </div>
  )
} 