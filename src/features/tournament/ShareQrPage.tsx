import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Check, Copy } from 'lucide-react'
import { useTournamentData } from '@/hooks/useTournamentData'
import { Button, PageHeader, Spinner } from '@/components'

export function ShareQrPage() {
  const { id } = useParams<{ id: string }>()
  const { tournament, loading } = useTournamentData({ id })
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const publicUrl = tournament ? `${window.location.origin}${import.meta.env.BASE_URL}tournoi/${tournament.slug}` : ''

  useEffect(() => {
    if (!publicUrl) return
    QRCode.toDataURL(publicUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#080D13', light: '#F3EBDD' },
    }).then(setQrDataUrl)
  }, [publicUrl])

  async function handleCopy() {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Partager" title="Le Challenge en direct" />

      <div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
        <p className="font-hand text-2xl text-gold">
          Scannez pour suivre le Challenge en direct
        </p>

        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt={`QR code vers ${publicUrl}`}
            className="w-full max-w-xs rounded-lg border-4 border-cream bg-cream"
          />
        )}

        <p className="max-w-xs break-all text-cream/60">{publicUrl}</p>

        <Button onClick={handleCopy} size="lg">
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Lien copié !' : 'Copier le lien'}
        </Button>

        <p className="max-w-sm text-sm text-cream/50">
          Affichez ce QR code à la buvette, sous la Halle, ou sur une affiche —
          pas besoin de compte ni d'application pour suivre le tournoi.
        </p>
      </div>
    </div>
  )
}
