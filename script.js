// Inisialisasi ikon UI
        lucide.createIcons();
// --- INISIALISASI PETA DASAR ---
        const map = L.map('map', { zoomControl: false }).setView([-5.397140, 105.266789], 15);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // ==========================================
        // FITUR BARU: Mengatur Urutan Tumpukan Layer
        // ==========================================
        map.createPane('pane_jalan');
        map.getPane('pane_jalan').style.zIndex = 400; // Posisi di bawah

        map.createPane('pane_rusak');
        map.getPane('pane_rusak').style.zIndex = 410; // Posisi lebih tinggi (selalu di atas)

        // --- BASEMAPS ---
        const satelit = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxNativeZoom: 19, // Mencegah layar abu-abu jika di-zoom lebih dari 19
            maxZoom: 22        // Mengizinkan scroll zoom lebih dekat lagi
        }).addTo(map);

        // --- LOGIKA BUKA/TUTUP PANEL KANAN ---
        const panelDetail = document.getElementById('panel-detail');
        
        // Tutup panel saat tombol silang (x) diklik
        document.getElementById('btn-close').addEventListener('click', () => {
            panelDetail.classList.add('translate-x-full');
        });

        // Tutup panel saat area peta kosong diklik
        map.on('click', () => {
            panelDetail.classList.add('translate-x-full');
        });

        // ====================================================================
        // INTEGRASI DATA KERUSAKAN JALAN (jalan_rusakk.geojson)
        // ====================================================================

        // 1. Fungsi untuk mengisi panel kanan saat kerusakan diklik
        // 1. Fungsi untuk mengisi panel kanan saat kerusakan diklik
       function tampilkanDetailKerusakan(props, latlng) {
            const kontenDetail = document.getElementById('konten-detail');
            document.querySelector('#panel-detail h2').textContent = "HASIL DETEKSI DEEP LEARNING";

            let klasifikasi = props.Klasifikas || 'Tidak Diketahui';
            let idKerusakan = props.OBJECTID || '-';

            // KODE YANG DIPERBAIKI: Menambahkan kata 'LUBANG'
            let isPothole = klasifikasi.toUpperCase().includes('PLOTHOLE') || 
                            klasifikasi.toUpperCase().includes('POTHOLE') || 
                            klasifikasi.toUpperCase().includes('LUBANG');
                            
            let badgeColor = isPothole ? 'bg-danger text-white' : 'bg-warning text-navy';

            // 1. Masukkan SEMUA foto LUBANG dari Desa & Provinsi
            const sampelPothole = [
                "foto ponsel desa/jalan_lubang.jpg",
                "foto ponsel desa/jalan_lubang3.jpg",
                "foto ponsel desa/jalan_lubangg.jpg",
                "foto ponsel desa/jalan.lubang.jpg",
                "foto ponsel prov/jalan_lubang.jpg",
                "foto ponsel prov/jalan_lubang2.jpg",
                "foto ponsel prov/jalan_lubang3.jpg"
            ]; 

            // 2. Masukkan SEMUA foto RETAK dari Desa & Provinsi
            const sampelCrack = [
                "foto ponsel desa/jalan_retak3.jpg",
                "foto ponsel prov/jalan_retak3.jpg",
                "foto ponsel prov/retak.jpg",
                "foto ponsel prov/retak2.jpg"
            ];
            
            // 3. Pemilihan otomatis berdasarkan data klik dari Peta (GeoJSON)
            // Jika AI mendeteksi 'Pothole', sistem HANYA akan memutar foto dari daftar sampelPothole[cite: 16]
            let kumpulanFoto = isPothole ? sampelPothole : sampelCrack;
            
            // 4. Rumus pembagian foto agar bervariasi tapi tetap konsisten
            let idAngka = parseInt(idKerusakan) || Math.floor(Math.random() * 100); 
            let indexFoto = idAngka % kumpulanFoto.length;
            let urlFotoDipilih = kumpulanFoto[indexFoto];

            // 5. Elemen gambar yang akan dimunculkan di HTML
            let elemenMedia = `
                <img src="${urlFotoDipilih}" alt="Foto Sampel" class="w-full h-auto rounded object-cover max-h-56 border border-slate-200 mb-1">
                <p class="text-[9px] text-slate-400 italic text-center mb-4">*Foto sebagai ilustrasi sampel lapangan</p>
            `;
            // ==========================================================
            kontenDetail.innerHTML = `
                ${elemenMedia}
                <div class="mb-4">
                    <span class="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-2 rounded-sm ${badgeColor}">
                        ${klasifikasi}
                    </span>
                    <div class="text-[10px] text-slate-500 font-mono">OBJECT ID: ${idKerusakan}</div>
                </div>
                <div class="space-y-3 text-sm border-t border-slate-100 pt-4">
                    <div class="flex justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500 text-xs">Sumber Data</span>
                        <span class="font-semibold text-accent">Model Deep Learning</span>
                    </div>
                    <div class="flex flex-col border-b border-slate-100 pb-2 gap-1">
                        <span class="text-slate-500 text-xs">Titik Koordinat Pusat</span>
                        <span class="font-mono text-[11px] text-slate-600">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
                    </div>
                </div>
                <button onclick="map.setView([${latlng.lat}, ${latlng.lng}], 20)" class="w-full mt-4 bg-slate-100 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-300">
                    Zoom ke Kerusakan
                </button>
            `;
            
            panelDetail.classList.remove('translate-x-full');
        }

        // 2. Mengambil dan menampilkan data jalan_rusakk.geojson
        fetch('data/jalan_gabungan_fiks.geojson')
            .then(response => response.json())
            .then(data => {
                deepLearningLayer = L.geoJSON(data, {
                    pane: 'pane_rusak',
                    // Gaya visual jika data Anda berupa Poligon/Bounding Box
                    style: function(feature) {
                        let klasifikasi = feature.properties.Klasifikas || "";
                        let isPothole = klasifikasi.toUpperCase().includes('PLOTHOLE') || klasifikasi.toUpperCase().includes('POTHOLE');
                        return { 
                            color: isPothole ? '#1414f0' : '#f59e0b', // Merah untuk Pothole, Kuning untuk Crack
                            weight: 2, 
                            fillOpacity: 0.3 
                        };
                    },
                    
                    // Gaya visual jika data Anda berupa Titik (Point)
                    pointToLayer: function(feature, latlng) {
                        let klasifikasi = feature.properties.Klasifikas || "";
                        let isPothole = klasifikasi.toUpperCase().includes('PLOTHOLE') || klasifikasi.toUpperCase().includes('POTHOLE');
                        return L.circleMarker(latlng, {
                            radius: 6, 
                            fillColor: isPothole ? '#ef4444' : '#3dd042', 
                            color: '#fff', 
                            weight: 1.5, 
                            fillOpacity: 0.9
                        });
                    },
                    
                    onEachFeature: function(feature, layer) {
                        let klasifikasi = feature.properties.Klasifikas || "Kerusakan";
                        
                        // Menampilkan label singkat saat kursor diarahkan (hover)
                        layer.bindTooltip(klasifikasi, { sticky: true, className: 'text-xs font-sans font-bold' });
                        
                        // Aksi ketika objek kerusakan diklik
                        layer.on('click', function(e) {
                            L.DomEvent.stopPropagation(e); // Mencegah bentrok dengan klik peta dasar
                            
                            // Ambil titik pusat dari objek yang diklik
                            let latlng = e.latlng ? e.latlng : e.target.getBounds().getCenter();
                            
                            tampilkanDetailKerusakan(feature.properties, latlng);
                            
                            map.flyTo(latlng, 19, { duration: 0.5 }); // Zoom lebih dekat
                        });
                    }
                }).addTo(map);

                // 3. Hubungkan dengan Checkbox "Deteksi Deep Learning" di Sidebar Kiri
                document.getElementById('chk-dl').addEventListener('change', function(e) {
                    if (e.target.checked) {
                        map.addLayer(deepLearningLayer);
                    } else {
                        map.removeLayer(deepLearningLayer);
                    }
                });
            })
            .catch(error => console.error("Error memuat jalan_rusakk.geojson:", error));

        // ====================================================================
        // INTEGRASI DATA JARINGAN JALAN (jalan_utama.geojson)
        // ====================================================================
        
        let roadLayer;
        
        // 1. Fungsi untuk mengisi panel kanan saat jalan diklik
        function tampilkanDetailJalan(props, latlng) {
            const kontenDetail = document.getElementById('konten-detail');
            document.querySelector('#panel-detail h2').textContent = "DETAIL JARINGAN JALAN";
            
            // Mengambil data dari properties GeoJSON Anda
            let jenisJalan = props.JENIS || 'Tidak Diketahui';
            let idJalan = props.OBJECTID_1 || '-';
            let panjangJalan = props.PANJANG ? parseFloat(props.PANJANG).toFixed(2) + " m" : "-";

            kontenDetail.innerHTML = `
                <div class="mb-4">
                    <h3 class="text-lg font-bold text-navy">${jenisJalan}</h3>
                    <div class="text-[10px] text-slate-500 font-mono">OBJECT ID: ${idJalan}</div>
                </div>
                <div class="space-y-3 text-sm border-t border-slate-100 pt-4">
                    <div class="flex justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500 text-xs">Panjang Jalan</span>
                        <span class="font-semibold text-navy">${panjangJalan}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 pb-2">
                        <span class="text-slate-500 text-xs">Status Kondisi</span>
                        <span class="font-semibold text-warning">Menunggu Deteksi</span>
                    </div>
                </div>
                <button onclick="map.setView([${latlng.lat}, ${latlng.lng}], 18)" class="w-full mt-4 bg-slate-100 text-slate-700 py-2 text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-300">
                    Pusatkan ke Lokasi
                </button>
            `;
            // Tampilkan panel
            panelDetail.classList.remove('translate-x-full');
        }

        // 2. Mengambil dan menampilkan data jalan_utama.geojson
        fetch('data/jalan_utama.geojson')
            .then(response => response.json())
            .then(data => {
                roadLayer = L.geoJSON(data, {
                    pane: 'pane_jalan',
                    // Warna garis jalan (Teal/Accent color)
                    style: { color: '#ff0000', weight: 4, opacity: 0.9 },
                    
                    onEachFeature: function(feature, layer) {
                        let jenis = feature.properties.JENIS || "Jaringan Jalan";
                        
                        // Menampilkan nama jenis jalan saat kursor diarahkan (hover)
                        layer.bindTooltip(jenis, { sticky: true, className: 'text-xs font-sans font-semibold' });
                        
                        // Aksi ketika garis jalan diklik
                        layer.on('click', function(e) {
                            L.DomEvent.stopPropagation(e); // Cegah klik tembus ke peta dasar
                            let latlng = e.latlng ? e.latlng : e.target.getBounds().getCenter();
                            
                            tampilkanDetailJalan(feature.properties, latlng);
                            map.flyTo(latlng, 17, { duration: 0.5 }); // Zoom halus ke jalan yang diklik
                        });
                    }
                }).addTo(map); // Langsung tambahkan ke peta

                // 3. FITUR PENTING: Peta otomatis zoom/pindah ke lokasi jaringan jalan
                map.fitBounds(roadLayer.getBounds());

                // 4. Hubungkan dengan Checkbox "Jaringan Jalan" di Sidebar Kiri
                document.getElementById('chk-road').addEventListener('change', function(e) {
                    if (e.target.checked) {
                        map.addLayer(roadLayer);
                    } else {
                        map.removeLayer(roadLayer);
                    }
                });
            })
            .catch(error => console.error("Error memuat jalan_utama.geojson:", error));

          // ====================================================================
        // INTEGRASI DATA ORTHOPHOTO DRONE (VERSI SEDERHANA)
        // ====================================================================

      // ====================================================================
        // INTEGRASI DATA ORTHOPHOTO (HASIL CLIP)
        // ====================================================================

        // UBAH baris pertama ini untuk mengarahkan ke folder yang baru
        let layerOrto = L.tileLayer('data/ortho clip/orto_tile/{z}/{x}/{y}.png', {
            maxZoom: 22,
            maxNativeZoom: 20, // (Jika render QGIS max 20)
            pane: 'pane_jalan',
            opacity: 1
        });

        // (Kodingan di bawahnya biarkan saja seperti sebelumnya)
        layerOrto.addTo(map);

       // ... kodingan checkbox ...
        document.getElementById('chk-ortho').addEventListener('change', function(e) {
            if (e.target.checked) {
                map.addLayer(layerOrto);
            } else {
                map.removeLayer(layerOrto);
            }
        });
        // ====================================================================
        // INTEGRASI DATA FOTO PONSEL & VIDEO DEEP LEARNING
        // ====================================================================

        // 1. Fungsi Universal untuk Membuka Panel Kanan (Foto / Video)
        function tampilkanDetailMedia(data, tipe, latlng) {
            const kontenDetail = document.getElementById('konten-detail');
            document.querySelector('#panel-detail h2').textContent = tipe === 'foto' ? "HASIL DETEKSI FOTO" : "HASIL DETEKSI VIDEO";

            // Siapkan elemen media (Img atau Video)
            let elemenMedia = '';
            if (tipe === 'foto') {
                elemenMedia = `<img src="${data.url}" alt="Deteksi AI" class="w-full h-auto rounded object-cover max-h-56 border border-slate-200">`;
            } else if (tipe === 'video') {
                elemenMedia = `<video controls autoplay class="w-full h-auto rounded border border-slate-200 max-h-56">
                                  <source src="${data.url}" type="video/mp4">
                                  Browser Anda tidak mendukung tag video.
                               </video>`;
            }

            kontenDetail.innerHTML = `
                <div class="mb-4">
                    <div class="bg-slate-100 rounded-md p-1 mb-3 shadow-sm">
                        ${elemenMedia}
                    </div>
                    <h3 class="text-sm font-bold text-navy mb-1">${data.judul}</h3>
                    
                    <div class="flex gap-2 mt-2">
                        <span class="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-slate-200 text-slate-700">
                            ${data.statusJalan}
                        </span>
                        <span class="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm ${tipe === 'foto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
                            Confidence: ${data.akurasi}%
                        </span>
                    </div>
                </div>
                <div class="space-y-3 text-sm border-t border-slate-100 pt-4">
                    <div class="flex flex-col border-b border-slate-100 pb-2 gap-1">
                        <span class="text-slate-500 text-xs">Koordinat Lokasi</span>
                        <span class="font-mono text-[11px] text-slate-600">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</span>
                    </div>
                </div>
            `;
            // Tampilkan sidebar
            document.getElementById('panel-detail').classList.remove('translate-x-full');
        }

        // 2. Database Sampel Foto Ponsel (5 Foto)
        const dataFotoPonsel = [
            { lat: -5.395000, lng: 105.265000, url: 'assets/foto1.jpg', judul: 'Lubang Kategori Berat', statusJalan: 'Jalan Desa', akurasi: 92 },
            { lat: -5.396000, lng: 105.266000, url: 'assets/foto2.jpg', judul: 'Retak Buaya (Alligator Cracking)', statusJalan: 'Jalan Desa', akurasi: 88 },
            { lat: -5.397000, lng: 105.267000, url: 'assets/foto3.jpg', judul: 'Lubang Dangkal', statusJalan: 'Jalan Desa', akurasi: 95 },
            { lat: -5.400000, lng: 105.270000, url: 'assets/foto4.jpg', judul: 'Kerusakan Tepi Jalan', statusJalan: 'Jalan Provinsi', akurasi: 85 },
            { lat: -5.401000, lng: 105.271000, url: 'assets/foto5.jpg', judul: 'Retak Memanjang', statusJalan: 'Jalan Provinsi', akurasi: 91 }
        ];

       // ====================================================================
        // PANEL FLOATING VIDEO (TANPA KOORDINAT)
        // ====================================================================

        // 1. Membuat Panel Khusus di Pinggir Layout Peta
        let PanelVideo = L.Control.extend({
            // Pilihan posisi: 'topleft', 'topright', 'bottomleft', 'bottomright'
            options: { position: 'bottomright' }, 
            
            onAdd: function (map) {
                // Membuat wadah div (box) dengan style bawaan Tailwind Anda
                let div = L.DomUtil.create('div', 'bg-white p-3 rounded-md shadow-lg border border-slate-200');
                div.style.width = '320px'; // Lebar kotak
                div.style.maxHeight = '65vh'; // Maksimal tinggi agar tidak tembus layar
                div.style.overflowY = 'auto'; // Bisa di-scroll jika kepanjangan
                
                // Mencegah klik atau scroll pada video tembus menggerakkan peta di belakangnya
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                div.innerHTML = `
                    <h3 class="text-sm font-bold text-navy mb-3 border-b pb-2">🎥 Video Hasil Deteksi Deep Learning</h3>
                    
                    <!-- Video Desa -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm">Jalan Desa</span>
                            <span class="text-[10px] font-semibold text-slate-500">Akurasi: 89%</span>
                        </div>
                        <video controls class="w-full bg-black rounded border border-slate-300 aspect-video object-contain">
                            <source src="video desa/marge_DESA.mp4" type="video/mp4">
                        </video>
                    </div>

                    <!-- Video Provinsi -->
                    <div class="mb-2">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-1 rounded-sm">Jalan Provinsi</span>
                            <span class="text-[10px] font-semibold text-slate-500">Akurasi: 94%</span>
                        </div>
                        <video controls class="w-full bg-black rounded border border-slate-300 aspect-video object-contain">
                            <source src="video prov/marge_PROV.mp4" type="video/mp4">
                        </video>
                    </div>
                `;
                return div;
            }
        });

        // 2. Simpan panel ke dalam variabel
        let kontrolVideo = new PanelVideo();

        // 3. Hubungkan dengan Checkbox Video di Panel Kiri
        document.getElementById('chk-dl-video').addEventListener('change', function(e) {
            if (e.target.checked) {
                map.addControl(kontrolVideo); // Munculkan panel di pojok layout
            } else {
                map.removeControl(kontrolVideo); // Sembunyikan panel
            }
        });

        // 4. Proses Pembuatan Layer
        let layerFoto = L.layerGroup();
        let layerVideo = L.layerGroup();

        // Masukkan titik foto ke layer (Warna Biru)
        dataFotoPonsel.forEach(item => {
            let markerFoto = L.circleMarker([item.lat, item.lng], {
                radius: 6, fillColor: '#3b82f6', color: '#ffffff', weight: 2, fillOpacity: 1
            }).bindTooltip(item.statusJalan + " - Klik lihat foto", { className: 'text-xs' });

            markerFoto.on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                tampilkanDetailMedia(item, 'foto', e.latlng);
                map.flyTo(e.latlng, 19, { duration: 0.5 });
            });
            markerFoto.addTo(layerFoto);
        });

        // Masukkan titik video ke layer (Warna Ungu)
        dataVideoAI.forEach(item => {
            let markerVideo = L.circleMarker([item.lat, item.lng], {
                radius: 7, fillColor: '#3fe9f1', color: '#ffffff', weight: 2, fillOpacity: 1
            }).bindTooltip(item.statusJalan + " - Klik putar video", { className: 'text-xs' });

            markerVideo.on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                tampilkanDetailMedia(item, 'video', e.latlng);
                map.flyTo(e.latlng, 19, { duration: 0.5 });
            });
            markerVideo.addTo(layerVideo);
        });
