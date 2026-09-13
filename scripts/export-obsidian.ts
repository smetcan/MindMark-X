import { syncToObsidian } from "../lib/export/obsidian";

async function main() {
  const customPath = process.argv[2];
  console.log(`\n🟣 MindMark-X -> Obsidian Vault Senkronizasyonu`);
  console.log(`--------------------------------------------------`);

  const result = await syncToObsidian(customPath);

  console.log(`Hedef Vault Klasörü: ${result.targetDir}`);
  console.log(`Veritabanında analiz edilmiş ${result.total} yer imi bulundu.\n`);
  console.log(`--------------------------------------------------`);
  console.log(`✅ Senkronizasyon Başarıyla Tamamlandı!`);
  console.log(`  - Yeni / Güncellenen Not: ${result.created}`);
  console.log(`  - Değişmemiş (Atlanan):   ${result.skipped}`);
  console.log(`  - Toplam Senkronize:     ${result.total}`);
  console.log(`  - Oluşturulan Fihrist:    ${result.indexFile}`);
  console.log(`--------------------------------------------------\n`);
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
