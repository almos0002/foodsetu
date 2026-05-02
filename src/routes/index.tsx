import { createFileRoute } from '@tanstack/react-router'
import { Sparkles, Utensils, Heart } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <Utensils className="h-10 w-10 text-orange-600" />
          <h1 className="text-5xl font-bold text-gray-900">FoodSetu</h1>
        </div>

        <p className="mb-8 text-xl font-light text-gray-700">
          Welcome! This project uses{' '}
          <span className="font-semibold">Tailwind CSS v4</span>,{' '}
          <span className="font-semibold">Lucide icons</span>, and the{' '}
          <span className="font-semibold">Poppins</span> font.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Sparkles className="mb-3 h-6 w-6 text-amber-500" />
            <h2 className="mb-1 text-lg font-semibold">Tailwind CSS v4</h2>
            <p className="text-sm text-gray-600">
              Modern utility-first CSS with a CSS-first config.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Heart className="mb-3 h-6 w-6 text-rose-500" />
            <h2 className="mb-1 text-lg font-semibold">Lucide Icons</h2>
            <p className="text-sm text-gray-600">
              Beautiful, consistent SVG icons via{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">
                lucide-react
              </code>
              .
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="mb-3 block text-2xl font-bold text-indigo-600">
              Aa
            </span>
            <h2 className="mb-1 text-lg font-semibold">Poppins Font</h2>
            <p className="text-sm text-gray-600">
              Loaded from Google Fonts and applied as the default sans font.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Font weight showcase</h3>
          <div className="space-y-1 text-gray-800">
            <p className="font-thin">Poppins Thin (100)</p>
            <p className="font-light">Poppins Light (300)</p>
            <p className="font-normal">Poppins Regular (400)</p>
            <p className="font-medium">Poppins Medium (500)</p>
            <p className="font-semibold">Poppins SemiBold (600)</p>
            <p className="font-bold">Poppins Bold (700)</p>
            <p className="font-black">Poppins Black (900)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
