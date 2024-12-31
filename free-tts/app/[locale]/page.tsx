
import { getCurrentLocale } from "@/locales/server";
import VoiceSelector from "./client/voice-selector";

export default async function Home() {

  const locale = await getCurrentLocale()

  return (
    <div className="grid  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center sm:items-start">
        <div>
          <VoiceSelector locale={locale} />
        </div>
      </main>
    </div>
  );
}
