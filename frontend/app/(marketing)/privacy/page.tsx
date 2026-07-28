import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  LegalHeader,
  LegalList,
  LegalSection,
} from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Bagaimana Topinz API mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function PrivacyPage() {
  return (
    <div className="container py-16 md:py-20">
      <article className="mx-auto max-w-2xl">
        <LegalHeader
          title="Privacy Policy"
          updated="1 Juli 2026"
          intro="Kebijakan ini menjelaskan data apa saja yang dikumpulkan Topinz API, bagaimana data tersebut digunakan dan dilindungi, serta hak-hak yang Anda miliki sebagai pengguna."
        />

        <LegalSection number={1} title="Ruang Lingkup">
          <p>
            Kebijakan privasi ini berlaku untuk seluruh layanan Topinz API,
            termasuk situs web, dashboard, dan endpoint API. Dengan
            menggunakan layanan, Anda menyetujui pengumpulan dan penggunaan
            data sebagaimana dijelaskan dalam dokumen ini.
          </p>
        </LegalSection>

        <LegalSection number={2} title="Data yang Kami Kumpulkan">
          <p>Kami mengumpulkan data berikut saat Anda menggunakan layanan:</p>
          <LegalList
            items={[
              "Data akun: nama, username, alamat email, dan nomor WhatsApp yang Anda berikan saat registrasi;",
              "Data teknis: alamat IP, endpoint yang diakses, metode HTTP, status code, dan waktu response setiap request (request logs);",
              "Data penggunaan: jumlah request harian serta riwayat aktivitas akun seperti reset API key dan perubahan whitelist IP.",
            ]}
          />
        </LegalSection>

        <LegalSection number={3} title="Penggunaan Data">
          <p>
            Data digunakan untuk mengoperasikan layanan: autentikasi,
            penghitungan kuota harian, penegakan whitelist IP dan rate limit,
            serta penyajian statistik penggunaan di dashboard Anda. Kami juga
            menggunakan data secara agregat untuk memantau kesehatan layanan
            dan mencegah penyalahgunaan. Nomor WhatsApp hanya digunakan untuk
            komunikasi terkait akun dan pembayaran.
          </p>
        </LegalSection>

        <LegalSection number={4} title="Cookie dan Sesi">
          <p>
            Kami menggunakan cookie fungsional untuk menyimpan token sesi
            (JWT) selama tujuh hari setelah login, serta preferensi tampilan
            seperti mode gelap. Kami tidak menggunakan cookie pelacakan iklan
            pihak ketiga. Menghapus cookie akan mengakhiri sesi dan
            mengharuskan Anda login kembali.
          </p>
        </LegalSection>

        <LegalSection number={5} title="Penyimpanan dan Keamanan">
          <p>
            Password disimpan dalam bentuk hash bcrypt dan tidak pernah
            disimpan sebagai teks biasa. Seluruh lalu lintas antara browser,
            server, dan API dienkripsi dalam transit. Akses internal terhadap
            data produksi dibatasi hanya untuk personel yang membutuhkannya
            dalam menjalankan layanan.
          </p>
        </LegalSection>

        <LegalSection number={6} title="Berbagi Data dengan Pihak Ketiga">
          <p>
            Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak
            mana pun. Data hanya dibagikan kepada penyedia infrastruktur yang
            diperlukan untuk mengoperasikan layanan — misalnya hosting dan
            pemrosesan pembayaran — atau apabila diwajibkan oleh hukum yang
            berlaku.
          </p>
        </LegalSection>

        <LegalSection number={7} title="Retensi Data">
          <p>
            Data akun disimpan selama akun Anda aktif. Request logs disimpan
            hingga 90 hari untuk kebutuhan monitoring, penghitungan uptime,
            dan investigasi penyalahgunaan, kemudian dihapus atau
            dianonimkan. Setelah akun dihapus, data pribadi akan dihapus dalam
            waktu maksimal 30 hari kecuali diwajibkan lain oleh hukum.
          </p>
        </LegalSection>

        <LegalSection number={8} title="Hak Pengguna">
          <p>
            Anda berhak mengakses dan memperbarui data profil melalui
            dashboard, meminta salinan data pribadi Anda, serta meminta
            penghapusan akun beserta data terkait. Permintaan dapat diajukan
            melalui email support dan akan kami proses dalam waktu yang
            wajar.
          </p>
        </LegalSection>

        <LegalSection number={9} title="Keamanan Pembayaran">
          <p>
            Kami tidak menyimpan nomor kartu maupun kredensial pembayaran
            Anda. Pembayaran diproses melalui penyedia pembayaran pihak
            ketiga, dan kami hanya menyimpan catatan status transaksi yang
            diperlukan untuk aktivasi paket Premium.
          </p>
        </LegalSection>

        <LegalSection number={10} title="Perubahan Kebijakan dan Kontak">
          <p>
            Kebijakan ini dapat diperbarui sewaktu-waktu; versi terbaru selalu
            tersedia di halaman ini beserta tanggal pembaruannya, dan
            perubahan material akan diberitahukan melalui email. Pertanyaan
            seputar privasi dapat dikirimkan ke {site.supportEmail}.
          </p>
        </LegalSection>
      </article>
    </div>
  );
}
