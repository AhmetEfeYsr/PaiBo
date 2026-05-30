# Paira Projesi (Kick Entegrasyonlu Bot Paneli) Kullanım ve Dağıtım Raporu

Bu rapor, Paira projesinin amacını, bileşenlerini ve üretim (production) ortamına nasıl taşınacağını açıklar. Proje, Kick yayıncıları için bir OBS widget'ı (örneğin atlama animasyonu) ve bu widget'ı yapılandırabilen, Kick OAuth akışı üzerinden yetkilendirme sağlayan bir React web panelinden oluşmaktadır. Ayrıca API işlemlerini yöneten AWS Lambda tabanlı sunucusuz (serverless) fonksiyonlar içerir.

## Proje Bileşenleri

1. **Panel (React + Vite):**
   - Kullanıcıların yapılandırma yapabildiği ve Kick hesaplarını bağladığı arayüzdür. `panel` klasörü içinde bulunur.
   - `App.jsx` ve `main.jsx` ana bileşenleridir.

2. **OBS Widget ve Statik Dosyalar:**
   - Kök dizindeki `.html` dosyası (ör. `atla.html`), resimler (`*.png`) ve ses dosyaları (`*.mp3`) OBS tarayıcı kaynaklarında çalıştırılacak widget arayüzüdür.
   - Panel üzerinden ayarlanan parametreler `atla.html`'e query parametreleriyle aktarılır.

3. **Serverless (AWS Lambda Fonksiyonları):**
   - **`kick_channel`**: Kanal bilgilerini çeken basit proxy veya kontrol noktası.
   - **`kick_oauth_callback`**: Kick OAuth işlemi sonucunda code'u token'a dönüştürür ve DynamoDB'ye kaydeder.
   - **`kick_send_message`**: Mesaj gönderimi ve token yenilemesi yapar.
   - **`kick_token_cron`**: DynamoDB'deki tokenleri toplu halde EventBridge aracılığıyla yenileyen cron job fonksiyonudur.

## Production'a (Canlıya) Alma Adımları

### 1. Veritabanı (AWS DynamoDB)
- AWS konsoluna giriş yapın.
- `KickUsersTokens` adında (Primary Key'i `userId` String olan) bir tablo oluşturun. (Eğer ortam değişkeni ile isim verecekseniz `DYNAMODB_TABLE_NAME` değişkenini kullanabilirsiniz).

### 2. Serverless Fonksiyonların (AWS Lambda) Dağıtımı
Her Lambda fonksiyonu için:
- Gerekli bağımlılıkları `npm install` ile kurun (AWS SDK v3 genelde Node 18+ ortamında hazır gelse de diğer paketler gerekebilir).
- Kodları zipleyerek AWS Lambda'ya yükleyin. (`build_production.sh` bu işlemi otomatik yapar).
- Çevresel değişkenleri (Environment Variables) tanımlayın:
  - `KICK_CLIENT_ID`: Kick'ten aldığınız Client ID.
  - `KICK_CLIENT_SECRET`: Kick'ten aldığınız Client Secret.
  - `KICK_REDIRECT_URI`: Sizin belirlediğiniz (AWS API Gateway veya özel domain) yönlendirme URL'si.
  - `DYNAMODB_TABLE_NAME`: `KickUsersTokens`
- `kick_channel`, `kick_oauth_callback` ve `kick_send_message` için API Gateway kurarak bunlara dışarıdan HTTP ile erişimi sağlayın.
- `kick_token_cron` fonksiyonu için AWS EventBridge (CloudWatch Events) üzerinden örneğin "rate(2 hours)" kuralıyla bir tetikleyici oluşturun.

### 3. Statik Panel ve Widget Dağıtımı
- `panel` klasöründe terminali açın.
- `npm install` ve ardından `npm run build` komutlarını çalıştırın.
- `panel/dist` klasörü içindeki tüm dosyaları (React uygulamanız) S3 Bucket, Vercel, Netlify veya Cloudflare Pages gibi bir statik barındırma servisine yükleyin.
- Ana dizindeki widget dosyalarını (`atla.html`, `.png`, `.json`, `.mp3` vb.) ve `panel/dist` klasörünü birleştirerek statik sunucunuza yükleyebilirsiniz. Böylelikle `bot.siteniz.com` paneli açarken, `bot.siteniz.com/atla.html` OBS widget'ını açacaktır.
- Frontend (React) kodundaki API Gateway bağlantılarını (örn. `AWS_CHANNEL_API_URL`, `AWS_CHAT_API_URL`, `KICK_OAUTH_CALLBACK_URL`) kendi canlı AWS API Gateway URL'leriniz ile değiştirmeyi unutmayın.

## Hızlı Başlangıç Scripts
Bu projenin production ortamına hazırlanması için root dizininde `build_production.sh` betiği oluşturulmuştur. Bu betik:
1. Panelin build işlemini yapar.
2. Lambda fonksiyonlarının bağımlılıklarını indirir ve deploy edilmeye hazır `.zip` dosyaları oluşturur.

```bash
chmod +x build_production.sh
./build_production.sh
```

Sonuç olarak tüm `*.zip` dosyalarını AWS'ye atıp, `panel/dist` klasörünü barındırıcıya yükleyerek projeyi ayağa kaldırabilirsiniz.