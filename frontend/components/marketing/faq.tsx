import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Dumb accordion list — reused by the landing FAQ and the pricing mini-FAQ. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const faqItems: FaqItem[] = [
  {
    question: "Apa itu Topinz API?",
    answer:
      "Topinz API adalah platform REST API dengan ratusan endpoint siap pakai untuk kebutuhan tools, text, utility, hingga anime. Semua endpoint diakses dengan satu API key dan mengembalikan response JSON dengan struktur yang konsisten.",
  },
  {
    question: "Bagaimana cara mendapatkan API key?",
    answer:
      "Daftar akun secara gratis dan API key dengan format Tpz-username akan dibuat otomatis. Anda dapat menyalin atau me-reset key tersebut kapan saja melalui dashboard.",
  },
  {
    question: "Apa perbedaan paket Free dan Premium?",
    answer:
      "Paket Free mendapat 30 request per hari dan akses ke seluruh endpoint gratis. Premium menaikkan kuota menjadi 5.000 request per hari, membuka endpoint premium, serta menyertakan whitelist IP dan support prioritas.",
  },
  {
    question: "Bagaimana cara mengatur whitelist IP?",
    answer:
      "Buka menu Whitelist IP di dashboard, lalu tambahkan alamat IPv4 server Anda beserta label opsional. Setelah daftar terisi, API key hanya dapat dipakai dari IP yang terdaftar sehingga tetap aman meskipun key bocor.",
  },
  {
    question: "Apa yang terjadi jika limit harian habis?",
    answer:
      "Request berikutnya ditolak dengan status 429 hingga kuota di-reset pada tengah malam. Sisa kuota harian Anda selalu terlihat secara real time di dashboard.",
  },
  {
    question: "Apakah bisa upgrade atau downgrade kapan saja?",
    answer:
      "Bisa. Upgrade ke Premium aktif segera setelah pembayaran dikonfirmasi, dan saat masa Premium berakhir akun otomatis kembali ke paket Free tanpa kehilangan data maupun API key.",
  },
];

export function FaqSection() {
  return (
    <section className="container py-20 md:py-24">
      <Reveal>
        <SectionHeading overline="FAQ" title="Frequently asked questions" />
      </Reveal>
      <Reveal delay={0.05} className="mx-auto mt-10 max-w-2xl">
        <FaqList items={faqItems} />
      </Reveal>
    </section>
  );
}
