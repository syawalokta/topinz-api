import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  LegalHeader,
  LegalList,
  LegalSection,
} from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Syarat dan ketentuan penggunaan layanan Topinz API.",
};

export default function TermsPage() {
  return (
    <div className="container py-16 md:py-20">
      <article className="mx-auto max-w-2xl">
        <LegalHeader
          title="Terms of Service"
          updated="1 Juli 2026"
          intro="Dokumen ini mengatur penggunaan seluruh layanan Topinz API, termasuk situs web, dashboard, dan endpoint API. Mohon dibaca dengan saksama sebelum menggunakan layanan."
        />

        <LegalSection number={1} title="Penerimaan Syarat">
          <p>
            Dengan membuat akun atau menggunakan layanan Topinz API, Anda
            menyatakan telah membaca, memahami, dan menyetujui seluruh
            ketentuan dalam dokumen ini. Jika Anda tidak menyetujui salah satu
            ketentuan, mohon untuk tidak menggunakan layanan. Penggunaan
            layanan secara berkelanjutan setelah syarat diperbarui dianggap
            sebagai persetujuan atas syarat yang baru.
          </p>
        </LegalSection>

        <LegalSection number={2} title="Deskripsi Layanan">
          <p>
            Topinz API adalah platform REST API yang menyediakan berbagai
            endpoint siap pakai — antara lain kategori tools, text, utility,
            dan anime — yang diakses menggunakan API key pribadi. Layanan
            mencakup dokumentasi endpoint, dashboard pemantauan penggunaan,
            serta paket berlangganan Free dan Premium sebagaimana dijelaskan
            pada halaman Pricing.
          </p>
        </LegalSection>

        <LegalSection number={3} title="Akun dan Keamanan API Key">
          <p>
            Anda bertanggung jawab atas kerahasiaan kredensial akun dan API
            key yang diterbitkan untuk Anda. Segala aktivitas yang dilakukan
            melalui API key Anda dianggap sebagai aktivitas Anda sendiri. Jika
            Anda menduga API key telah bocor, segera lakukan reset key melalui
            dashboard atau hubungi tim support. Kami menganjurkan penggunaan
            fitur whitelist IP untuk membatasi asal request ke API key Anda.
          </p>
        </LegalSection>

        <LegalSection number={4} title="Penggunaan yang Diizinkan dan Dilarang">
          <p>
            Layanan hanya boleh digunakan untuk tujuan yang sah dan sesuai
            hukum yang berlaku. Tanpa membatasi ketentuan lain, Anda dilarang:
          </p>
          <LegalList
            items={[
              "Menggunakan layanan untuk aktivitas ilegal, termasuk pengambilan data (scraping) yang melanggar hukum atau hak pihak ketiga;",
              "Melakukan abuse, flooding, atau upaya melewati mekanisme rate limit dan pembatasan lainnya;",
              "Menjual kembali, menyewakan, atau membagikan API key kepada pihak lain tanpa izin tertulis dari kami;",
              "Memindai celah keamanan, mengganggu, atau mencoba mengakses sistem kami tanpa otorisasi.",
            ]}
          />
          <p>
            Pelanggaran atas ketentuan ini dapat berakibat penangguhan atau
            penghentian akun tanpa pemberitahuan sebelumnya.
          </p>
        </LegalSection>

        <LegalSection number={5} title="Limit Penggunaan dan Fair Use">
          <p>
            Setiap paket memiliki kuota request harian — 30 request per hari
            untuk Free dan 5.000 request per hari untuk Premium — serta rate
            limit per menit pada tiap endpoint. Request yang melebihi kuota
            ditolak dengan status 429 dan kuota di-reset setiap tengah malam.
            Kami dapat menyesuaikan limit secara wajar bila diperlukan untuk
            menjaga kestabilan layanan bagi seluruh pengguna.
          </p>
        </LegalSection>

        <LegalSection number={6} title="Pembayaran, Perpanjangan, dan Refund">
          <p>
            Paket Premium ditagih di muka dengan harga yang tercantum pada
            halaman Pricing dan aktif setelah pembayaran dikonfirmasi. Masa
            aktif Premium berlaku 30 hari sejak aktivasi dan tidak diperpanjang
            secara otomatis; setelah berakhir, akun kembali ke paket Free.
            Pembayaran yang telah diproses tidak dapat dikembalikan, kecuali
            terjadi kegagalan layanan berkepanjangan yang berasal dari sisi
            kami dan dinilai wajar untuk dikompensasi.
          </p>
        </LegalSection>

        <LegalSection number={7} title="Ketersediaan Layanan">
          <p>
            Kami menargetkan ketersediaan layanan 99,9% berdasarkan upaya
            terbaik (best effort), tanpa jaminan kontraktual maupun kompensasi
            otomatis. Pemeliharaan terjadwal, gangguan jaringan pihak ketiga,
            atau keadaan kahar dapat menyebabkan layanan tidak tersedia untuk
            sementara. Kondisi layanan terkini dapat dipantau melalui halaman
            Status.
          </p>
        </LegalSection>

        <LegalSection number={8} title="Penghentian dan Penangguhan Akun">
          <p>
            Anda dapat berhenti menggunakan layanan dan meminta penghapusan
            akun kapan saja melalui tim support. Kami berhak menangguhkan atau
            menghentikan akun yang melanggar syarat ini, menunggak pembayaran,
            atau membahayakan keamanan dan kestabilan platform. Setelah
            penghentian, API key dinonaktifkan dan hak akses terhadap layanan
            berakhir.
          </p>
        </LegalSection>

        <LegalSection number={9} title="Batasan Tanggung Jawab">
          <p>
            Layanan disediakan sebagaimana adanya (as is) tanpa jaminan
            tersurat maupun tersirat. Sepanjang diizinkan oleh hukum yang
            berlaku, Topinz API tidak bertanggung jawab atas kerugian tidak
            langsung, kehilangan keuntungan, atau kehilangan data yang timbul
            dari penggunaan layanan. Total tanggung jawab kami dalam keadaan
            apa pun dibatasi sebesar jumlah yang Anda bayarkan kepada kami
            dalam tiga bulan terakhir.
          </p>
        </LegalSection>

        <LegalSection number={10} title="Perubahan Syarat dan Kontak">
          <p>
            Kami dapat memperbarui syarat ini dari waktu ke waktu. Perubahan
            material akan diumumkan melalui email atau pengumuman di dashboard
            setidaknya tujuh hari sebelum berlaku. Pertanyaan mengenai syarat
            ini dapat dikirimkan ke {site.supportEmail}.
          </p>
        </LegalSection>
      </article>
    </div>
  );
}
