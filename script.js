document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup Tombol Download
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.addEventListener('click', processVideo);
    }
    
    // 2. Setup Jam Taskbar (Realtime)
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const clockEl = document.querySelector('.clock');
        if (clockEl) {
            clockEl.innerText = timeString;
        }
    }, 1000);
});

// --- KONFIGURASI API ---
const rapidApiKey = '9fa87cb832msh951f5c755373df7p1f46cajsn459f2635b5c5'; 
const rapidApiHost = 'social-download-all-in-one.p.rapidapi.com';

async function processVideo() {
    const urlInput = document.getElementById('videoUrl').value;
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');
    const content = document.getElementById('downloadContent');
    const resList = document.getElementById('resolutionList');
    const videoMeta = document.getElementById('videoMeta');

    // Validasi
    if (!urlInput || urlInput.trim() === "") {
        alert("ERROR: URL NOT FOUND. PLEASE INPUT LINK.");
        return;
    }

    // UI Loading
    resultArea.classList.remove('hidden');
    loader.classList.remove('hidden');
    content.classList.add('hidden');
    resList.innerHTML = ''; 
    videoMeta.innerHTML = '';

    const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': rapidApiHost,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput }) 
        });

        if (!response.ok) throw new Error("Server Error");

        const data = await response.json();
        renderResult(data);

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        alert("SYSTEM FAILURE: " + error.message);
    }
}

function renderResult(data) {
    const loader = document.getElementById('loader');
    const content = document.getElementById('downloadContent');
    const resList = document.getElementById('resolutionList');
    const videoMeta = document.getElementById('videoMeta');

    loader.classList.add('hidden');
    content.classList.remove('hidden');

    const title = data.title || "Unknown_File.mp4";
    const img = data.cover || data.thumbnail || "https://via.placeholder.com/300x200?text=No+Image";

    videoMeta.innerHTML = `
        <img src="${img}" alt="Thumbnail">
        <p style="font-family:'VT323'; font-size:1.2rem; margin-top:5px;">${title}</p>
    `;

    // --- LOGIKA FILTERING & SORTING ---
    let links = []; 
    
    if (data.medias && Array.isArray(data.medias)) {
        links = data.medias;
    } else if (data.url) {
        links.push({ quality: 'HD', url: data.url, extension: 'mp4' });
    }

    // 1. Helper: Cek Resolusi (Angka)
    const getResValue = (item) => {
        if (item.extension === 'mp3' || item.type === 'audio') return 0;
        const qual = item.quality || ""; 
        const match = qual.match(/(\d+)/);
        if (match) return parseInt(match[0]);
        return 1; 
    };

    // 2. Helper: Cek Apakah Ada Suara?
    const checkAudio = (item) => {
        // Jika file audio/mp3, pasti ada suara
        if (item.extension === 'mp3' || item.type === 'audio') return true;
        
        // Cek flag dari API (kadang API kasih info 'audio: false')
        if (item.audio === false) return false;
        if (item.mute === true) return false;
        
        // Cek dari teks quality (kadang tertulis 'video only')
        if (item.quality && item.quality.toLowerCase().includes('video only')) return false;
        if (item.quality && item.quality.toLowerCase().includes('mute')) return false;

        return true; // Default anggap ada suara
    };

    // 3. SORTING: Prioritaskan yg ADA SUARA dulu, baru Resolusi Tinggi
    links.sort((a, b) => {
        const audioA = checkAudio(a) ? 1 : 0;
        const audioB = checkAudio(b) ? 1 : 0;

        // Jika status audio beda, menangkan yg ada audio
        if (audioA !== audioB) {
            return audioB - audioA;
        }
        // Jika status audio sama, urutkan berdasarkan resolusi
        return getResValue(b) - getResValue(a);
    });

    if (links.length > 0) {
        links.forEach(item => {
            if (item.url) {
                const linkBtn = document.createElement('a');
                linkBtn.className = 'res-btn';
                linkBtn.href = item.url;
                linkBtn.target = '_blank';
                
                let label = item.quality || item.extension || 'Download';
                if (item.formattedSize) label += ` (${item.formattedSize})`;
                
                let icon = 'fa-file-video';
                let soundBadge = '<span style="color:#0f0;">🔊</span>'; // Ikon Speaker Hijau
                let extraStyle = '';

                // Logika Tampilan Audio vs Video
                if (item.extension === 'mp3' || item.type === 'audio') {
                    icon = 'fa-music';
                    label = "AUDIO ONLY (MP3)";
                    soundBadge = '';
                } else if (!checkAudio(item)) {
                    // Jika Video Bisu
                    icon = 'fa-volume-xmark';
                    soundBadge = '<span style="color:red; font-size:0.8rem;">🔇 NO SOUND</span>';
                    extraStyle = 'background:#eee; color:#999; border-color:#999;'; // Bikin tombol agak abu-abu
                    label += ' (Video Only)';
                }

                // Terapkan style khusus untuk tombol mute
                if(extraStyle) {
                   linkBtn.style.cssText = extraStyle;
                }

                linkBtn.innerHTML = `
                    <span><i class="fa-solid ${icon}"></i> DOWNLOAD ${soundBadge}</span>
                    <span class="quality-badge">${label}</span>
                `;
                resList.appendChild(linkBtn);
            }
        });
    } else {
        resList.innerHTML = '<p>DATA CORRUPTED: No links found.</p>';
    }
}

function resetApp() {
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoUrl').focus();
}