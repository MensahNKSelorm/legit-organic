import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Photo Credits",
  description: "Photography credits and licensing information for Legit Organic.",
  path: "/photo-credits",
});

export default function PhotoCreditsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] pt-32 pb-24 text-[#0D3B2A] dark:bg-[#171B18] dark:text-[#FEFCF7]">
      <div className="page-container">
        <header className="max-w-4xl border-b border-[#0D3B2A]/20 pb-12 dark:border-white/20">
          <p className="text-sm font-bold text-[#2E7D32] dark:text-[#F4C430]">
            Image acknowledgements
          </p>
          <h1 className="display-organic mt-5 text-[clamp(4rem,9vw,8rem)] leading-[.86]">
            Photo credits
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5B3E31] dark:text-[#B8D4BD]">
            Photography helps us show the farms, food and people behind a more connected food
            system.
          </p>
        </header>

        <article className="grid gap-8 border-b border-[#0D3B2A]/20 py-10 md:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] md:items-start dark:border-white/20">
          <p className="text-xs font-bold tracking-[.14em] text-[#2E7D32] uppercase dark:text-[#F4C430]">
            Homepage hero
          </p>
          <div>
            <h2 className="display-organic text-3xl md:text-4xl">
              Carrot harvest with subtle rebellion
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
              Photograph by{" "}
              <a
                href="https://www.flickr.com/photos/56846427@N02"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-current font-bold text-[#0D3B2A] hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:text-[#FEFCF7] dark:hover:text-[#F4C430]"
              >
                chadskeers
              </a>
              . Used under{" "}
              <a
                href="https://creativecommons.org/licenses/by/2.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-current font-bold text-[#0D3B2A] hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:text-[#FEFCF7] dark:hover:text-[#F4C430]"
              >
                CC BY 2.0
              </a>
              . Cropped and darkened for presentation.
            </p>
            <a
              href="https://www.flickr.com/photos/56846427@N02/5457912937"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex border-b border-[#0D3B2A] pb-1 text-sm font-bold whitespace-nowrap hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:border-[#F4C430] dark:text-[#F4C430]"
            >
              View the original photograph ↗
            </a>
          </div>
        </article>

        <article className="grid gap-8 border-b border-[#0D3B2A]/20 py-10 md:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] md:items-start dark:border-white/20">
          <p className="text-xs font-bold tracking-[.14em] text-[#2E7D32] uppercase dark:text-[#F4C430]">
            B2B: Schools
          </p>
          <div>
            <h2 className="display-organic text-3xl md:text-4xl">classroom</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[#5B3E31] dark:text-[#B8D4BD]">
              Photograph by{" "}
              <a
                href="https://www.flickr.com/photos/22294215@N06"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-current font-bold text-[#0D3B2A] hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:text-[#FEFCF7] dark:hover:text-[#F4C430]"
              >
                michael pollak
              </a>
              . Used under{" "}
              <a
                href="https://creativecommons.org/licenses/by/2.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-current font-bold text-[#0D3B2A] hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:text-[#FEFCF7] dark:hover:text-[#F4C430]"
              >
                CC BY 2.0
              </a>
              . Cropped for presentation.
            </p>
            <a
              href="https://www.flickr.com/photos/22294215@N06/14504392015"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex border-b border-[#0D3B2A] pb-1 text-sm font-bold whitespace-nowrap hover:text-[#2E7D32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C430] dark:border-[#F4C430] dark:text-[#F4C430]"
            >
              View the original photograph ↗
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
