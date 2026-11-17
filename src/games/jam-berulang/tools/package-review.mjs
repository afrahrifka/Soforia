import {readFile,writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join,basename} from 'node:path';
import assert from 'node:assert/strict';
export async function packageReview(options={}){
 const root='src/games/jam-berulang/evidence',reportPath=options.reportPath??`${root}/video-review-report.json`,report=JSON.parse(await readFile(reportPath,'utf8'));
 const stamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 const metadata=';FFMETADATA1\ntitle=Jam Berulang — Simulasi Review Developer\n'+report.chapters.map((c,i)=>`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.seconds*1000)}\nEND=${Math.round((report.chapters[i+1]?.seconds??report.duration)*1000)}\ntitle=${c.district}. ${c.title} (${c.speed}x)\n`).join('');
 const metaPath=reportPath.replace('-report.json','-chapters.ffmetadata');await writeFile(metaPath,metadata);
 const packaged=join(dirname(report.video),basename(report.video,'.mp4')+'-packaged.mp4');
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',report.video,'-i',metaPath,'-map','0:v:0','-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',packaged]);
 await rename(packaged,report.video);
 execFileSync('ffmpeg',['-hide_banner','-v','error','-i',report.video,'-map','0:v:0','-f','null','-']);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-show_chapters','-of','json',report.video],{encoding:'utf8'}));
 assert.equal(probe.chapters.length,6);assert.equal(Number(probe.streams[0].nb_frames),report.frames);
 report.bytes=Number(probe.format.size);report.duration=Number(probe.format.duration);report.fullDecode='PASS';report.embeddedChapters=6;
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
 const notes=`# Video review Jam Berulang\n\n[Putar/unduh MP4](${report.video}) · 1280 × 720 · ${report.fps} fps · ${stamp(report.duration)} · tanpa audio.\n\n| Mulai | Distrik | Kecepatan |\n|---|---|---|\n${report.chapters.map(c=>`| ${stamp(c.seconds)} | ${c.title} | ${c.speed}× |`).join('\n')}\n\nEnam distrik diselesaikan berurutan melalui input analog dan aksi pada server asli. Tidak ada teleportasi untuk melewati rintangan; kembali ke spawn terjadi melalui Ulang menit dan transisi distrik sesuai aturan. Penjelasan aksi membekukan simulasi sejenak. Perekaman dilakukan offline per frame, sehingga angka fps video bukan hasil benchmark permainan realtime. Bukan playtest manusia atau dua HP fisik.\n\nFokus review: ukuran/keterbacaan karakter dan roda, kamera, bangunan yang menutupi pelat, perbedaan Pelari/gema/pratinjau, kejelasan gerbang terbuka/terkait, waktu menunggu replay dan variasi puzzle/peran B. Rute otomatis mengetahui solusi dan tidak mewakili durasi eksplorasi pemain baru.\n\nVideo memiliki enam bab tertanam. Pemeriksaan decode penuh dan metadata ada pada [laporan](${basename(reportPath)}).\n`;
 await writeFile(options.notesPath??`${root}/VIDEO-REVIEW.md`,notes);console.log(`PASS: MP4, 6 bab, decode penuh, ${stamp(report.duration)}, ${(report.bytes/1048576).toFixed(1)} MiB.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await packageReview();
