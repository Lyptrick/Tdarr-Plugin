/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

/*
 * Tdarr Classic Plugin
 * customH264AacGerman
 * Version 1.9.6
 *
 * FIX 1.9.6:
 * - Entfernt 'h264' strikt aus der Target-Codec-Liste.
 * - Striktere HDR-Erkennung, damit Tonemapping-Filter nicht auf SDR angewendet werden.
 * - Garantiert "processFile = false", wenn Video bereits H.264 8-Bit SDR ist.
 */

const details = () => ({
  id: 'customH264AacGerman',
  Stage: 'Pre-processing',
  Name: 'H.264 AAC Direct Play (QSV/AMF)',
  Type: 'Video',
  Operation: 'Transcode',
  Description:
    'Erzeugt H.264 8-bit für maximale Direct-Play-Kompatibilität. ' +
    'Verwendet Intel QSV, AMD AMF oder NVIDIA NVENC abhängig vom Node-Mapping. ' +
    'HDR kann nach SDR BT.709 konvertiert werden. ' +
    'Eine deutsche Audiospur wird nach AAC konvertiert.',
  Version: '1.9.6',
  Tags: 'h264,qsv,amf,nvenc,aac,german,hdr,directplay,node-mapping',

  Inputs: [
    {
      name: 'Target Video Codecs',
      type: 'string',
      defaultValue: 'hevc,av1,mpeg4,vc1,vp9',
      inputUI: { type: 'text' },
      tooltip:
        'Kommagetrennte Video-Codecs, DIE NACH H.264 KONVERTIERT WERDEN SOLLEN (z. B. hevc, av1). Niemals h264 eintragen!',
    },
    {
      name: 'Node Hardware Mapping',
      type: 'string',
      defaultValue: 'Keller-Node=qsv,Windows-AMD=amf',
      inputUI: { type: 'text' },
      tooltip:
        'Format: NodeName=qsv,NodeName=amf,NodeName=nvenc. ' +
        'Das Mapping hat Vorrang vor nodeHardwareType.',
    },
    {
      name: 'QSV Quality',
      type: 'number',
      defaultValue: 18,
      inputUI: { type: 'text' },
      tooltip: 'Intel QSV global_quality.',
    },
    {
      name: 'QSV Preset',
      type: 'string',
      defaultValue: 'medium',
      inputUI: { type: 'text' },
      tooltip: 'Intel QSV Preset.',
    },
    {
      name: 'AMF Quality',
      type: 'string',
      defaultValue: 'quality',
      inputUI: { type: 'text' },
      tooltip: 'AMD AMF Quality: speed, balanced oder quality.',
    },
    {
      name: 'AMF QP',
      type: 'number',
      defaultValue: 20,
      inputUI: { type: 'text' },
      tooltip: 'AMD AMF CQP-Wert.',
    },
    {
      name: 'AAC Bitrate',
      type: 'string',
      defaultValue: '192k',
      inputUI: { type: 'text' },
      tooltip: 'AAC Bitrate der deutschen Audiospur.',
    },
    {
      name: 'Max Audio Channels',
      type: 'number',
      defaultValue: 6,
      inputUI: { type: 'text' },
      tooltip:
        'Maximale Audiokanäle. 6 = 5.1. Kleinere Quellen werden nicht hochgerechnet.',
    },
    {
      name: 'German Languages',
      type: 'string',
      defaultValue: 'ger,de,deu,german',
      inputUI: { type: 'text' },
      tooltip: 'Kommagetrennte deutsche Sprachkennungen.',
    },
    {
      name: 'Subtitle Mode',
      type: 'string',
      defaultValue: 'German Forced',
      inputUI: {
        type: 'dropdown',
        options: ['None', 'German', 'German Forced', 'German Forced behalten'],
      },
      tooltip:
        'None = keine Untertitel. German = deutsche Untertitel. ' +
        'German Forced = nur deutsche Forced-Untertitel.',
    },
    {
      name: 'HDR Mode',
      type: 'string',
      defaultValue: 'Convert HDR to SDR',
      inputUI: {
        type: 'dropdown',
        options: ['Convert HDR to SDR', 'Keep HDR'],
      },
      tooltip: 'HDR kann nach SDR BT.709 tonemapped werden.',
    },
    {
      name: 'Remove Data Streams',
      type: 'boolean',
      defaultValue: true,
      inputUI: { type: 'dropdown', options: ['true', 'false'] },
      tooltip: 'Entfernt Datenstreams.',
    },
    {
      name: 'Copy Metadata',
      type: 'boolean',
      defaultValue: true,
      inputUI: { type: 'dropdown', options: ['true', 'false'] },
      tooltip: 'Übernimmt Metadaten.',
    },
    {
      name: 'Copy Chapters',
      type: 'boolean',
      defaultValue: true,
      inputUI: { type: 'dropdown', options: ['true', 'false'] },
      tooltip: 'Übernimmt Kapitel.',
    },
  ],
});

function parseHardwareMapping(value) {
  const result = {};
  String(value || '').split(',').forEach((entry) => {
    const pos = entry.indexOf('=');
    if (pos === -1) return;
    const node = entry.substring(0, pos).trim().toLowerCase();
    const hardware = entry.substring(pos + 1).trim().toLowerCase();
    if (node && hardware) result[node] = hardware;
  });
  return result;
}

function normalizeHardwareType(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'qsv' || v.includes('qsv')) return 'qsv';
  if (v === 'amf' || v.includes('amf')) return 'amf';
  if (v === 'nvenc' || v.includes('nvenc')) return 'nvenc';
  return '';
}

function getNodeName(otherArguments) {
  if (!otherArguments) return '';
  const candidates = [
    otherArguments.nodeName,
    otherArguments.nodeData && otherArguments.nodeData.nodeName,
    otherArguments.configVars && otherArguments.configVars.config && otherArguments.configVars.config.nodeName,
    otherArguments.configVars && otherArguments.configVars.nodeName,
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] !== undefined && candidates[i] !== null && String(candidates[i]).trim() !== '') {
      return String(candidates[i]).trim();
    }
  }
  return '';
}

function getNodeHardwareType(otherArguments) {
  if (!otherArguments) return '';
  const candidates = [
    otherArguments.nodeHardwareType,
    otherArguments.nodeData && otherArguments.nodeData.nodeHardwareType,
    otherArguments.configVars && otherArguments.configVars.config && otherArguments.configVars.config.nodeHardwareType,
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] !== undefined && candidates[i] !== null && String(candidates[i]).trim() !== '') {
      return String(candidates[i]).trim();
    }
  }
  return '';
}

function bool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  const v = value.toLowerCase().trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);

  const response = {
    processFile: false,
    infoLog: '',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    preset: '',
    container: '.mkv',
  };

  // Säubere Codec-Liste und schließe 'h264' als Quell-Triggermarke explizit aus
  const rawTargetCodecs = String(inputs['Target Video Codecs'] || 'hevc,av1,mpeg4,vc1,vp9')
    .toLowerCase()
    .split(',')
    .map((x) => x.trim());
  const targetVideoCodecs = rawTargetCodecs.filter((x) => x && x !== 'h264' && x !== 'x264');

  const nodeHardwareMapping = String(inputs['Node Hardware Mapping'] || 'Keller-Node=qsv,Windows-AMD=amf').trim();
  const qsvQuality = Number(inputs['QSV Quality'] || 18);
  const qsvPreset = String(inputs['QSV Preset'] || 'medium');
  const amfQuality = String(inputs['AMF Quality'] || 'quality');
  const amfQP = Number(inputs['AMF QP'] || 20);
  const aacBitrate = String(inputs['AAC Bitrate'] || '192k');
  const maxAudioChannels = Number(inputs['Max Audio Channels'] || 6);

  const germanLanguages = String(inputs['German Languages'] || 'ger,de,deu,german')
    .toLowerCase()
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  const subtitleMode = String(inputs['Subtitle Mode'] || 'German Forced');
  const hdrMode = String(inputs['HDR Mode'] || 'Convert HDR to SDR');
  const removeData = bool(inputs['Remove Data Streams'], true);
  const copyMetadata = bool(inputs['Copy Metadata'], true);
  const copyChapters = bool(inputs['Copy Chapters'], true);

  if (!file || file.fileMedium !== 'video' || !file.ffProbeData || !Array.isArray(file.ffProbeData.streams)) {
    response.infoLog = 'CUSTOM H264 AAC 1.9.6: Datei ist kein Video oder probeData fehlt.';
    return response;
  }

  const streams = file.ffProbeData.streams;

  // Hardware-Erkennung
  const currentNodeName = getNodeName(otherArguments);
  const rawNodeHardwareType = getNodeHardwareType(otherArguments);
  const mapping = parseHardwareMapping(nodeHardwareMapping);

  let detectedHardware = '';
  if (currentNodeName && mapping[currentNodeName.toLowerCase()]) {
    detectedHardware = normalizeHardwareType(mapping[currentNodeName.toLowerCase()]);
  }
  if (!detectedHardware && rawNodeHardwareType) {
    detectedHardware = normalizeHardwareType(rawNodeHardwareType);
  }

  let encoder = '';
  if (detectedHardware === 'qsv') encoder = 'h264_qsv';
  else if (detectedHardware === 'amf') encoder = 'h264_amf';
  else if (detectedHardware === 'nvenc') encoder = 'h264_nvenc';

  if (!encoder) {
    response.infoLog = 'CUSTOM H264 AAC 1.9.6: Kein zugewiesener Hardware-Encoder gefunden.';
    return response;
  }

  // Video-Analyse
  let videoStream = null;
  let videoIndex = -1;

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (String(stream.codec_type || '').toLowerCase() !== 'video') continue;
    const codec = String(stream.codec_name || '').toLowerCase();
    if (codec === 'mjpeg' || codec === 'png') continue;

    videoStream = stream;
    videoIndex = stream.index !== undefined ? stream.index : i;
    break;
  }

  if (!videoStream) {
    response.infoLog = 'Kein verwendbarer Videostream gefunden.';
    return response;
  }

  const videoCodec = String(videoStream.codec_name || '').toLowerCase();
  const videoProfile = String(videoStream.profile || '').toLowerCase();
  const pixelFormat = String(videoStream.pix_fmt || '').toLowerCase();
  const bitDepth = Number(videoStream.bits_per_raw_sample || videoStream.bit_depth || 0);

  const is10Bit = bitDepth >= 10 || pixelFormat.includes('10') || pixelFormat.includes('p010') || videoProfile.includes('10');

  const colorTransfer = String(videoStream.color_transfer || videoStream.color_transfer_characteristics || '').toLowerCase();
  const colorPrimaries = String(videoStream.color_primaries || '').toLowerCase();

  const isHDR = colorTransfer.includes('smpte2084') || colorTransfer.includes('pq') || colorPrimaries.includes('bt2020') || colorTransfer.includes('hlg');
  const needsHDRConversion = isHDR && hdrMode.toLowerCase().includes('convert');

  // Prüfen, ob Video bereits ein kompatibles H.264 8-Bit SDR ist
  const isAlreadyH264SDR = videoCodec === 'h264' && !is10Bit && !isHDR;
  const isMatchTargetList = targetVideoCodecs.includes(videoCodec);

  // Re-Encode ist NUR nötig, wenn der Codec in der Umwandlungsliste steht, 10-Bit ist ODER HDR konvertiert werden muss
  const needsVideoTranscode = !isAlreadyH264SDR && (isMatchTargetList || is10Bit || needsHDRConversion);

  // Audio-Analyse
  let germanAudio = null;
  let germanAudioIndex = -1;

  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i];
    if (String(stream.codec_type || '').toLowerCase() !== 'audio') continue;

    const tags = stream.tags || {};
    const language = String(tags.language || tags.LANGUAGE || tags.lang || stream.language || '').toLowerCase().trim();
    const title = String(tags.title || '').toLowerCase();

    const languageMatches = germanLanguages.includes(language) || germanLanguages.some((lang) => title.includes(lang));

    if (languageMatches) {
      germanAudio = stream;
      germanAudioIndex = stream.index !== undefined ? stream.index : i;
      break;
    }
  }

  if (!germanAudio) {
    response.infoLog = 'CUSTOM H264 AAC 1.9.6: Keine deutsche Audiospur gefunden. Überspringe.';
    return response;
  }

  const germanAudioCodec = String(germanAudio.codec_name || '').toLowerCase();
  const germanAudioChannels = Number(germanAudio.channels || 2);
  const outputAudioChannels = maxAudioChannels > 0 ? Math.min(germanAudioChannels, maxAudioChannels) : germanAudioChannels;

  const needsAudioTranscode = germanAudioCodec !== 'aac' || germanAudioChannels > outputAudioChannels;

  // Strikter Abbruch zur Loop-Vermeidung
  if (!needsVideoTranscode && !needsAudioTranscode) {
    response.infoLog =
      '========== CUSTOM H264 AAC 1.9.6 ==========\n' +
      'Datei entspricht vollkommen dem Zielformat:\n' +
      `- Video: ${videoCodec} 8-Bit SDR (Passthrough)\n` +
      `- Audio: ${germanAudioCodec} ${germanAudioChannels} Kanäle (Passthrough)\n` +
      'Verarbeitung wird erfolgreich beendet.\n' +
      '==========================================';
    response.processFile = false;
    return response;
  }

  // Untertitel
  const selectedSubtitles = [];
  const subtitleModeLower = subtitleMode.toLowerCase();
  const keepSubtitles = !subtitleModeLower.includes('none');
  const forcedOnly = subtitleModeLower.includes('forced');

  if (keepSubtitles) {
    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i];
      if (String(stream.codec_type || '').toLowerCase() !== 'subtitle') continue;

      const tags = stream.tags || {};
      const language = String(tags.language || tags.LANGUAGE || tags.lang || stream.language || '').toLowerCase().trim();
      const isGerman = germanLanguages.includes(language);
      const forced = stream.disposition && (Number(stream.disposition.forced) === 1 || stream.disposition.forced === true);

      if (isGerman && (!forcedOnly || forced)) {
        selectedSubtitles.push(stream);
      }
    }
  }

  // FFmpeg Arguments
  const args = [];

  args.push('-map', `0:${videoIndex}`);
  args.push('-map', `0:${germanAudioIndex}`);

  // Video Parameter
  if (!needsVideoTranscode) {
    args.push('-c:v', 'copy');
  } else {
    if (encoder === 'h264_qsv') {
      args.push('-c:v', 'h264_qsv', '-global_quality', String(qsvQuality), '-preset', qsvPreset, '-pix_fmt', 'nv12');
    } else if (encoder === 'h264_amf') {
      args.push('-c:v', 'h264_amf', '-quality', amfQuality, '-rc', 'cqp', '-qp_i', String(amfQP), '-qp_p', String(amfQP), '-qp_b', String(amfQP), '-pix_fmt', 'yuv420p');
    } else {
      args.push('-c:v', 'h264_nvenc', '-cq', String(amfQP), '-pix_fmt', 'yuv420p');
    }

    if (needsHDRConversion) {
      args.push('-vf', 'tonemap=mobius:desat=0,format=yuv420p');
    }
  }

  // Audio Parameter
  if (needsAudioTranscode) {
    args.push('-c:a:0', 'aac', '-b:a:0', aacBitrate, '-ac:a:0', String(outputAudioChannels));
  } else {
    args.push('-c:a:0', 'copy');
  }

  args.push('-metadata:s:a:0', 'language=de', '-disposition:a:0', 'default');

  // Untertitel Parameter
  selectedSubtitles.forEach((subtitle, idx) => {
    const subtitleIndex = subtitle.index !== undefined ? subtitle.index : streams.indexOf(subtitle);
    args.push('-map', `0:${subtitleIndex}`, `-c:s:${idx}`, 'copy');
  });

  if (removeData) {
    args.push('-dn');
  }

  args.push(
    '-map_metadata', copyMetadata ? '0' : '-1',
    '-map_chapters', copyChapters ? '0' : '-1',
    '-max_muxing_queue_size', '4096'
  );

  response.preset = `<io> ${args.join(' ')}`;
  response.container = '.mkv';
  response.processFile = true;
  response.reQueueAfter = true;

  response.infoLog = `CUSTOM H264 AAC 1.9.6: Konvertierung gestartet (Video: ${needsVideoTranscode ? encoder : 'copy'}, Audio: ${needsAudioTranscode ? 'aac' : 'copy'})`;

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
