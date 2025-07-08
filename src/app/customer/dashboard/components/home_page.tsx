import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useTheme } from '@/app/context/ThemeContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/app/context/LanguageContext'

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

// Translation object for home page
const t = {
  welcome: { en: 'Welcome to EEUMS Dashboard', am: 'ወደ ኢትዮ ኤሌከትሪክ እንኳን ደህና መጡ' },
  verificationRequired: { en: 'Account Verification Required', am: 'የመለያ ማረጋገጫ ያስፈልጋል' },
  pending: { en: 'Your verification is pending approval. Some features are limited until verification is complete.', am: 'የእርስዎ ማረጋገጫ በመጠባበቅ ላይ ነው። ' },
  rejected: { en: 'Your verification was rejected: ', am: 'የእርስዎ ማረጋገጫ ተቀባይነት አላገኘም፡ ' },
  rejectedNoReason: { en: 'No reason specified', am: 'ምክንያቱ አልተገለጸም' },
  rejectedResubmit: { en: 'Please resubmit.', am: 'እባክዎ ደግመው ያስገቡ።' },
  verifyPrompt: { en: 'Please verify your account to access all services and features.', am: 'ሁሉንም አገልግሎቶች  ለማግኘት እባክዎ መለያዎን ያረጋግጡ።' },
  resubmit: { en: 'Resubmit Verification', am: 'ማረጋገጫ ደግመው ያስገቡ' },
  verify: { en: 'Verify Account', am: 'መለያ ያረጋግጡ' },
  latestNews: { en: 'Latest News', am: 'የቅርብ ጊዜ ዜና' },
  showMore: { en: 'Show more', am: 'ተጨማሪ አሳይ' },
  showLess: { en: 'Show less', am: 'አሳንስ' },
  publishedOn: { en: 'Published on:', am: 'ቀን፦' },
  noNews: { en: 'No news articles available at the moment.', am: 'በአሁኑ ጊዜ ምንም የዜና መጣጥፎች የሉም።' },
}

export default function HomePage({ verification, loading }: HomePageProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const { language } = useLanguage()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [expandedNews, setExpandedNews] = useState<string | null>(null)

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

  const toggleExpand = (id: string) => {
    setExpandedNews(expandedNews === id ? null : id)
  }

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
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">{t.welcome[language]}</h1>

          
          {!isVerified && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-red-500 dark:text-red-400" />
                <h3 className="font-medium text-red-700 dark:text-red-300">{t.verificationRequired[language]}</h3>
              </div>
              <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                {isPending ? 
                  t.pending[language] :
                isRejected ?
                  `${t.rejected[language]}${verification.rejectionReason || t.rejectedNoReason[language]}. ${t.rejectedResubmit[language]}` :
                  t.verifyPrompt[language]}
              </p>
              <Button 
                variant="secondary" 
                className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800/50 dark:hover:bg-red-800 dark:text-red-200" 
                onClick={() => router.push('/customer/verify')}
              >
                {isRejected ? t.resubmit[language] : t.verify[language]}
              </Button>
            </div>
          )}
        </div>

        {/* News Section - Shown to all users */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-foreground mb-4">{t.latestNews[language]}</h2>
          {loadingNews ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
            </div>
          ) : news.length > 0 ? (
            <div className="grid gap-4">
              {news.map((article) => {
                const isExpanded = expandedNews === article.id
                return (
                  <Card key={article.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-foreground  dark:text-black">
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
                      {isExpanded ? (
                        <>
                          <div
                            className="prose max-w-none text-foreground text-sm dark:text-black"
                            dangerouslySetInnerHTML={{
                              __html: article.content,
                            }}
                          />
                          <button
                            className="mt-2 text-blue-600 dark:text-blue-400 underline"
                            onClick={() => toggleExpand(article.id)}
                          >
                            {t.showLess[language]}
                          </button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t.publishedOn[language]} {new Date(article.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        article.content.length > 0 && (
                          <button
                            className="mt-2 text-blue-600 dark:text-blue-400 underline"
                            onClick={() => toggleExpand(article.id)}
                          >
                            {t.showMore[language]}
                          </button>
                        )
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">{t.noNews[language]}</p>
          )}
        </div>

        

        
      </main>
    </div>
  )
} 