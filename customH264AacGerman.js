/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

/*
 * Tdarr Classic Plugin
 * customH264AacGerman
 *
 * Version 1.9.11
 *
 * ============================================================
 * ZIEL
 * ============================================================
 *
 * - HEVC / AV1 / MPEG4 / VC1 / VP9 -> H.264
 * - H.264 8-bit SDR -> COPY
 * - H.264 10-bit -> H.264 8-bit
 * - HDR10 / HLG -> optional SDR BT.709
 * - Intel QSV / AMD AMF / NVIDIA NVENC
 * - Hardware ausschließlich über Node Hardware Mapping
 * - CPU Decode, kein Hardware Decode
 * - genau eine deutsche Audiospur
 * - Audio bei Bedarf -> AAC
 * - maximal konfigurierte Kanalzahl
 * - deutsche Forced-Untertitel optional
 * - andere Audio-/Subtitle-/Data-Streams werden nicht übernommen
 * - Metadaten und Kapitel optional
 *
 * ============================================================
 * WICHTIG
 * ============================================================
 *
 * Node Hardware Mapping:
 *
 *   Keller-Node=qsv,Windows-AMD=amf
 *
 * Unterstützt:
 *
 *   qsv   -> h264_qsv
 *   amf   -> h264_amf
 *   nvenc -> h264_nvenc
 *
 * Der Node-Name hat Vorrang vor nodeHardwareType.
 *
 * ============================================================
 */

const details = () => ({
  id: 'customH264AacGerman',

  Stage: 'Pre-processing',

  Name: 'H.264 AAC Direct Play (QSV/AMF/NVENC) 1.9.11',

  Type: 'Video',

  Operation: 'Transcode',

  Description:
    'Erzeugt H.264 8-bit für maximale Direct-Play-Kompatibilität. ' +
    'Hardware wird über das konfigurierbare Node Hardware Mapping ausgewählt. ' +
    'HDR10/HLG kann nach SDR BT.709 konvertiert werden. ' +
    'Eine deutsche Audiospur wird ausgewählt und bei Bedarf nach AAC konvertiert.',

  Version: '1.9.11',

  Tags:
    'h264,qsv,amf,nvenc,aac,german,hdr,directplay,node-mapping',

  Inputs: [

    // ============================================================
    // TARGET VIDEO CODECS
    // ============================================================

    {
      name: 'Target Video Codecs',

      type: 'string',

      defaultValue:
        'hevc,av1,mpeg4,vc1,vp9',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Kommagetrennte Video-Codecs, die nach H.264 konvertiert werden. ' +
        'H.264 niemals eintragen.',
    },


    // ============================================================
    // NODE HARDWARE MAPPING
    // ============================================================

    {
      name: 'Node Hardware Mapping',

      type: 'string',

      defaultValue:
        'Keller-Node=qsv,Windows-AMD=amf',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Zuordnung der Tdarr Nodes zur Hardware. ' +
        'Beispiel: Keller-Node=qsv,Windows-AMD=amf. ' +
        'Unterstützt qsv, amf und nvenc.',
    },


    // ============================================================
    // QSV
    // ============================================================

    {
      name: 'QSV Quality',

      type: 'number',

      defaultValue: 18,

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Intel QSV global_quality. ' +
        'Niedriger = bessere Qualität / größere Datei.',
    },


    {
      name: 'QSV Preset',

      type: 'string',

      defaultValue: 'medium',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Intel QSV Preset.',
    },


    // ============================================================
    // AMF
    // ============================================================

    {
      name: 'AMF Quality',

      type: 'string',

      defaultValue: 'quality',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AMD AMF Quality: speed, balanced oder quality.',
    },


    {
      name: 'AMF QP',

      type: 'number',

      defaultValue: 20,

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AMD AMF CQP-Wert. 20 ist ein guter Ausgangspunkt.',
    },


    // ============================================================
    // AUDIO
    // ============================================================

    {
      name: 'AAC Bitrate',

      type: 'string',

      defaultValue:
        '192k',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AAC Bitrate der deutschen Audiospur.',
    },


    {
      name: 'Max Audio Channels',

      type: 'number',

      defaultValue:
        6,

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Maximale Audiokanäle. 6 = 5.1. ' +
        'Eine kleinere Quelle wird nicht künstlich hochgerechnet.',
    },


    {
      name: 'German Languages',

      type: 'string',

      defaultValue:
        'ger,de,deu,german',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Kommagetrennte deutsche Sprachkennungen.',
    },


    // ============================================================
    // SUBTITLES
    // ============================================================

    {
      name: 'Subtitle Mode',

      type: 'string',

      defaultValue:
        'German Forced',

      inputUI: {
        type: 'dropdown',

        options: [
          'None',
          'German',
          'German Forced',
          'Deutsche Forced behalten',
        ],
      },

      tooltip:
        'None = keine Untertitel. ' +
        'German = deutsche Untertitel. ' +
        'German Forced = nur deutsche Forced-Untertitel.',
    },


    // ============================================================
    // HDR
    // ============================================================

    {
      name: 'HDR Mode',

      type: 'string',

      defaultValue:
        'Convert HDR to SDR',

      inputUI: {
        type: 'dropdown',

        options: [
          'Convert HDR to SDR',
          'Keep HDR',
        ],
      },

      tooltip:
        'HDR10/HLG nach SDR BT.709 konvertieren oder HDR behalten.',
    },


    // ============================================================
    // OTHER
    // ============================================================

    {
      name: 'Remove Data Streams',

      type: 'boolean',

      defaultValue:
        true,

      inputUI: {
        type: 'dropdown',

        options: [
          'true',
          'false',
        ],
      },

      tooltip:
        'Datenstreams entfernen.',
    },


    {
      name: 'Copy Metadata',

      type: 'boolean',

      defaultValue:
        true,

      inputUI: {
        type: 'dropdown',

        options: [
          'true',
          'false',
        ],
      },

      tooltip:
        'Metadaten übernehmen.',
    },


    {
      name: 'Copy Chapters',

      type: 'boolean',

      defaultValue:
        true,

      inputUI: {
        type: 'dropdown',

        options: [
          'true',
          'false',
        ],
      },

      tooltip:
        'Kapitel übernehmen.',
    },


    // ============================================================
    // LEGACY
    // ============================================================

    {
      name: 'Codecs to H.264',

      type: 'string',

      defaultValue:
        'hevc,av1,mpeg4,vc1,vp9',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Legacy-Alias für Target Video Codecs.',
    },
  ],
});


// ================================================================
// HARDWARE MAPPING
// ================================================================

function parseHardwareMapping(value) {

  const result = {};

  String(value || '')
    .split(',')
    .forEach((entry) => {

      const parts =
        entry.split('=');

      if (parts.length < 2) {
        return;
      }

      const node =
        String(parts[0] || '')
          .trim();

      const hardware =
        String(
          parts
            .slice(1)
            .join('=') || ''
        )
          .trim();

      if (node && hardware) {

        result[
          node.toLowerCase()
        ] =
          hardware.toLowerCase();
      }
    });

  return result;
}


// ================================================================
// NORMALIZE HARDWARE
// ================================================================

function normalizeHardwareType(value) {

  const v =
    String(value || '')
      .trim()
      .toLowerCase();

  if (
    v === 'qsv' ||
    v.includes('qsv')
  ) {
    return 'qsv';
  }

  if (
    v === 'amf' ||
    v.includes('amf')
  ) {
    return 'amf';
  }

  if (
    v === 'nvenc' ||
    v.includes('nvenc')
  ) {
    return 'nvenc';
  }

  return '';
}


// ================================================================
// NODE NAME
// ================================================================

function getNodeName(otherArguments) {

  if (!otherArguments) {
    return '';
  }

  const candidates = [

    otherArguments.nodeName,

    otherArguments.nodeData &&
      otherArguments.nodeData.nodeName,

    otherArguments.configVars &&
      otherArguments.configVars.config &&
      otherArguments.configVars.config.nodeName,

    otherArguments.configVars &&
      otherArguments.configVars.nodeName,

    otherArguments.workerData &&
      otherArguments.workerData.nodeName,

    otherArguments.worker &&
      otherArguments.worker.nodeName,
  ];

  for (
    let i = 0;
    i < candidates.length;
    i++
  ) {

    if (
      candidates[i] !== undefined &&
      candidates[i] !== null &&
      String(candidates[i]).trim() !== ''
    ) {

      return String(
        candidates[i]
      ).trim();
    }
  }

  return '';
}


// ================================================================
// NODE HARDWARE TYPE
// ================================================================

function getNodeHardwareType(otherArguments) {

  if (!otherArguments) {
    return '';
  }

  const candidates = [

    otherArguments.nodeHardwareType,

    otherArguments.nodeData &&
      otherArguments.nodeData.nodeHardwareType,

    otherArguments.configVars &&
      otherArguments.configVars.config &&
      otherArguments.configVars.config.nodeHardwareType,
  ];

  for (
    let i = 0;
    i < candidates.length;
    i++
  ) {

    if (
      candidates[i] !== undefined &&
      candidates[i] !== null &&
      String(candidates[i]).trim() !== ''
    ) {

      return String(
        candidates[i]
      ).trim();
    }
  }

  return '';
}


// ================================================================
// BOOLEAN
// ================================================================

function bool(value, fallback) {

  if (
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (
    typeof value !== 'string'
  ) {
    return fallback;
  }

  const v =
    value
      .toLowerCase()
      .trim();

  if (v === 'true') {
    return true;
  }

  if (v === 'false') {
    return false;
  }

  return fallback;
}


// ================================================================
// LANGUAGE
// ================================================================

function getLanguage(stream) {

  const tags =
    stream && stream.tags
      ? stream.tags
      : {};

  return String(
    tags.language ||
    tags.LANGUAGE ||
    tags.lang ||
    tags.LANG ||
    stream.language ||
    ''
  )
    .toLowerCase()
    .trim();
}


// ================================================================
// FORCED SUBTITLE
// ================================================================

function isForcedSubtitle(stream) {

  const disposition =
    stream && stream.disposition
      ? stream.disposition
      : {};

  return (
    Number(disposition.forced) === 1 ||
    disposition.forced === true
  );
}


// ================================================================
// PLUGIN
// ================================================================

const plugin = (
  file,
  librarySettings,
  inputs,
  otherArguments
) => {

  const lib =
    require('../methods/lib')();

  inputs =
    lib.loadDefaultValues(
      inputs,
      details
    );


  // ============================================================
  // RESPONSE
  // ============================================================

  const response = {

    processFile: false,

    infoLog: '',

    handBrakeMode: false,

    FFmpegMode: true,

    reQueueAfter: false,

    preset: '',

    container: '.mkv',
  };


  // ============================================================
  // INPUTS
  // ============================================================

  const targetVideoCodecs =
    String(
      inputs['Target Video Codecs'] ||
      inputs['Codecs to H.264'] ||
      'hevc,av1,mpeg4,vc1,vp9'
    )
      .toLowerCase()
      .split(',')
      .map(
        (x) =>
          x.trim()
      )
      .filter(Boolean);


  const nodeHardwareMapping =
    String(
      inputs['Node Hardware Mapping'] ||
      'Keller-Node=qsv,Windows-AMD=amf'
    )
      .trim();


  const qsvQuality =
    Number(
      inputs['QSV Quality'] ||
      18
    );


  const qsvPreset =
    String(
      inputs['QSV Preset'] ||
      'medium'
    )
      .trim();


  const amfQuality =
    String(
      inputs['AMF Quality'] ||
      'quality'
    )
      .trim();


  const amfQP =
    Number(
      inputs['AMF QP'] ||
      20
    );


  const aacBitrate =
    String(
      inputs['AAC Bitrate'] ||
      '192k'
    )
      .trim();


  const maxAudioChannels =
    Number(
      inputs['Max Audio Channels'] ||
      6
    );


  const germanLanguages =
    String(
      inputs['German Languages'] ||
      'ger,de,deu,german'
    )
      .toLowerCase()
      .split(',')
      .map(
        (x) =>
          x.trim()
      )
      .filter(Boolean);


  const subtitleMode =
    String(
      inputs['Subtitle Mode'] ||
      'German Forced'
    )
      .trim();


  const hdrMode =
    String(
      inputs['HDR Mode'] ||
      'Convert HDR to SDR'
    )
      .trim();


  const removeData =
    bool(
      inputs['Remove Data Streams'],
      true
    );


  const copyMetadata =
    bool(
      inputs['Copy Metadata'],
      true
    );


  const copyChapters =
    bool(
      inputs['Copy Chapters'],
      true
    );


  // ============================================================
  // BASIC CHECKS
  // ============================================================

  if (
    !file ||
    file.fileMedium !== 'video'
  ) {

    response.infoLog =
      'CUSTOM H264 AAC 1.9.11\n' +
      'Datei ist kein Video. Datei wird übersprungen.';

    return response;
  }


  if (
    !file.ffProbeData ||
    !Array.isArray(
      file.ffProbeData.streams
    )
  ) {

    response.infoLog =
      'CUSTOM H264 AAC 1.9.11\n' +
      'FFprobe-Daten fehlen. Datei wird übersprungen.';

    return response;
  }


  const streams =
    file.ffProbeData.streams;


  // ============================================================
  // NODE / HARDWARE
  // ============================================================

  const currentNodeName =
    getNodeName(
      otherArguments
    );


  const rawNodeHardwareType =
    getNodeHardwareType(
      otherArguments
    );


  const mapping =
    parseHardwareMapping(
      nodeHardwareMapping
    );


  let detectedHardware =
    '';


  let mappingDescription =
    '';


  // ------------------------------------------------------------
  // NODE NAME HAS PRIORITY
  // ------------------------------------------------------------

  if (
    currentNodeName &&
    mapping[
      currentNodeName.toLowerCase()
    ]
  ) {

    detectedHardware =
      normalizeHardwareType(
        mapping[
          currentNodeName.toLowerCase()
        ]
      );


    mappingDescription =
      `Match über Node-Name (` +
      `${currentNodeName} -> ` +
      `${detectedHardware})`;
  }


  // ------------------------------------------------------------
  // FALLBACK HARDWARE TYPE
  // ------------------------------------------------------------

  if (
    !detectedHardware &&
    rawNodeHardwareType
  ) {

    detectedHardware =
      normalizeHardwareType(
        rawNodeHardwareType
      );


    mappingDescription =
      `Fallback über Tdarr ` +
      `nodeHardwareType (` +
      `${rawNodeHardwareType})`;
  }


  let encoder =
    '';


  let hardwareVendor =
    '';


  if (
    detectedHardware === 'qsv'
  ) {

    encoder =
      'h264_qsv';

    hardwareVendor =
      'Intel QSV';
  }

  else if (
    detectedHardware === 'amf'
  ) {

    encoder =
      'h264_amf';

    hardwareVendor =
      'AMD AMF';
  }

  else if (
    detectedHardware === 'nvenc'
  ) {

    encoder =
      'h264_nvenc';

    hardwareVendor =
      'NVIDIA NVENC';
  }


  if (!encoder) {

    response.infoLog =
      '========== CUSTOM H264 AAC 1.9.11 ==========\n' +
      `Node Name: ${
        currentNodeName ||
        'unknown'
      }\n` +
      `Tdarr nodeHardwareType: ${
        rawNodeHardwareType ||
        'unknown'
      }\n` +
      `Node Hardware Mapping: ${
        nodeHardwareMapping
      }\n` +
      'Hardware mapping result: NO MATCH\n\n' +
      'Unterstützte Hardware:\n' +
      'qsv = Intel QSV\n' +
      'amf = AMD AMF\n' +
      'nvenc = NVIDIA NVENC\n\n' +
      'Datei wird aus Sicherheitsgründen übersprungen.\n';

    return response;
  }


  // ============================================================
  // VIDEO STREAM
  // ============================================================

  let videoStream =
    null;


  let videoIndex =
    -1;


  for (
    let i = 0;
    i < streams.length;
    i++
  ) {

    const stream =
      streams[i];


    if (
      String(
        stream.codec_type || ''
      ).toLowerCase() !==
      'video'
    ) {
      continue;
    }


    const codec =
      String(
        stream.codec_name || ''
      ).toLowerCase();


    if (
      codec === 'mjpeg' ||
      codec === 'png' ||
      codec === 'bmp'
    ) {
      continue;
    }


    videoStream =
      stream;


    videoIndex =
      stream.index !== undefined
        ? Number(stream.index)
        : i;


    break;
  }


  if (!videoStream) {

    response.infoLog =
      'CUSTOM H264 AAC 1.9.11\n' +
      'Kein verwendbarer Videostream gefunden.';

    return response;
  }


  // ============================================================
  // VIDEO PROPERTIES
  // ============================================================

  const videoCodec =
    String(
      videoStream.codec_name || ''
    )
      .toLowerCase();


  const videoProfile =
    String(
      videoStream.profile || ''
    )
      .toLowerCase();


  const pixelFormat =
    String(
      videoStream.pix_fmt || ''
    )
      .toLowerCase();


  const width =
    Number(
      videoStream.width || 0
    );


  const height =
    Number(
      videoStream.height || 0
    );


  const bitDepth =
    Number(
      videoStream.bits_per_raw_sample ||
      videoStream.bit_depth ||
      (
        pixelFormat.includes('10') ||
        pixelFormat.includes('p010') ||
        pixelFormat.includes('p012')
          ? 10
          : 8
      )
    );


  const is10Bit =
    bitDepth >= 10 ||
    pixelFormat.includes('10') ||
    pixelFormat.includes('p010') ||
    pixelFormat.includes('p012') ||
    pixelFormat.includes('p016') ||
    videoProfile.includes('10');


  // ============================================================
  // COLOR
  // ============================================================

  const colorTransfer =
    String(
      videoStream.color_transfer ||
      videoStream.color_transfer_characteristics ||
      ''
    )
      .toLowerCase()
      .trim();


  const colorPrimaries =
    String(
      videoStream.color_primaries ||
      ''
    )
      .toLowerCase()
      .trim();


  const colorSpace =
    String(
      videoStream.colorspace ||
      videoStream.color_space ||
      ''
    )
      .toLowerCase()
      .trim();


  /*
   * WICHTIG:
   *
   * BT.2020 alleine bedeutet NICHT automatisch HDR.
   *
   * HDR10:
   *   SMPTE ST 2084 / PQ
   *
   * HLG:
   *   ARIB STD-B67
   *
   * Dadurch wird ein bereits nach SDR konvertiertes H.264
   * mit eventuell verbliebenen BT.2020-Metadaten nicht
   * nochmals tonemapped.
   */

  const isPQ =
    colorTransfer === 'smpte2084' ||
    colorTransfer === 'pq';


  const isHLG =
    colorTransfer === 'arib-std-b67' ||
    colorTransfer === 'hlg';


  const isHDR10 =
    isPQ;


  const isHDR =
    isPQ ||
    isHLG;


  const convertHDR =
    hdrMode
      .toLowerCase()
      .includes('convert');


  const needsHDRConversion =
    isHDR &&
    convertHDR;


  // ============================================================
  // VIDEO DECISION
  // ============================================================

  const isH264EightBit =
    videoCodec === 'h264' &&
    !is10Bit &&
    pixelFormat !== 'yuv422p' &&
    pixelFormat !== 'yuv444p';


  const isTargetCodec =
    targetVideoCodecs.includes(
      videoCodec
    );


  /*
   * H.264 8-bit:
   *
   *   SDR -> COPY
   *   HDR -> encode if tonemapping enabled
   *
   * Other codecs:
   *
   *   always encode if configured target
   */

  const copyVideo =
    isH264EightBit &&
    !needsHDRConversion;


  const needsVideoTranscode =
    !copyVideo &&
    (
      isTargetCodec ||
      is10Bit ||
      needsHDRConversion ||
      videoCodec !== 'h264'
    );


  if (
    !needsVideoTranscode &&
    !copyVideo
  ) {

    response.infoLog =
      'CUSTOM H264 AAC 1.9.11\n' +
      `Video-Codec "${videoCodec}" ` +
      'ist nicht als Zielcodec konfiguriert.\n' +
      `Konfigurierte Zielcodecs: ${
        targetVideoCodecs.join(', ')
      }\n` +
      'Datei wird übersprungen.';

    return response;
  }


  // ============================================================
  // AUDIO
  // ============================================================

  let germanAudio =
    null;


  let germanAudioIndex =
    -1;


  for (
    let i = 0;
    i < streams.length;
    i++
  ) {

    const stream =
      streams[i];


    if (
      String(
        stream.codec_type || ''
      ).toLowerCase() !==
      'audio'
    ) {
      continue;
    }


    const language =
      getLanguage(
        stream
      );


    const title =
      String(
        stream.tags &&
        stream.tags.title
          ? stream.tags.title
          : ''
      )
        .toLowerCase();


    const languageMatches =
      germanLanguages.includes(
        language
      ) ||
      germanLanguages.some(
        (lang) =>
          title === lang ||
          title.includes(lang)
      );


    if (
      languageMatches
    ) {

      germanAudio =
        stream;


      germanAudioIndex =
        stream.index !== undefined
          ? Number(
              stream.index
            )
          : i;


      break;
    }
  }


  if (!germanAudio) {

    response.infoLog =
      'CUSTOM H264 AAC 1.9.11\n' +
      `Node Name: ${
        currentNodeName ||
        'unknown'
      }\n` +
      `Hardware encoder: ${
        encoder
      }\n` +
      `Video codec: ${
        videoCodec
      }\n\n` +
      'Keine deutsche Audiospur gefunden.\n' +
      `Gesuchte Sprachen: ${
        germanLanguages.join(', ')
      }\n` +
      'Datei wird aus Sicherheitsgründen übersprungen.';

    return response;
  }


  const germanAudioCodec =
    String(
      germanAudio.codec_name || ''
    )
      .toLowerCase();


  const germanAudioChannels =
    Number(
      germanAudio.channels || 2
    );


  const outputAudioChannels =
    maxAudioChannels > 0
      ? Math.min(
          germanAudioChannels,
          maxAudioChannels
        )
      : germanAudioChannels;


  const audioAlreadyAAC =
    germanAudioCodec === 'aac';


  const audioNeedsChannelChange =
    maxAudioChannels > 0 &&
    germanAudioChannels >
      maxAudioChannels;


  const needsAudioTranscode =
    !audioAlreadyAAC ||
    audioNeedsChannelChange;


  // ============================================================
  // SUBTITLES
  // ============================================================

  const selectedSubtitles =
    [];


  const subtitleModeLower =
    subtitleMode
      .toLowerCase();


  const keepSubtitles =
    !subtitleModeLower.includes(
      'none'
    );


  const forcedOnly =
    subtitleModeLower.includes(
      'forced'
    );


  if (keepSubtitles) {

    for (
      let i = 0;
      i < streams.length;
      i++
    ) {

      const stream =
        streams[i];


      if (
        String(
          stream.codec_type || ''
        ).toLowerCase() !==
        'subtitle'
      ) {
        continue;
      }


      const language =
        getLanguage(
          stream
        );


      const isGerman =
        germanLanguages.includes(
          language
        );


      const forced =
        isForcedSubtitle(
          stream
        );


      if (
        isGerman &&
        (
          !forcedOnly ||
          forced
        )
      ) {

        selectedSubtitles.push({
          stream,
          index:
            stream.index !== undefined
              ? Number(
                  stream.index
                )
              : i,
        });
      }
    }
  }


  // ============================================================
  // FFMPEG
  // ============================================================

  const args =
    [];


  // ------------------------------------------------------------
  // VIDEO MAP
  // ------------------------------------------------------------

  args.push(
    '-map',
    `0:${videoIndex}`
  );


  // ------------------------------------------------------------
  // AUDIO MAP
  // ------------------------------------------------------------

  args.push(
    '-map',
    `0:${germanAudioIndex}`
  );


  // ------------------------------------------------------------
  // VIDEO ENCODER
  // ------------------------------------------------------------

  if (copyVideo) {

    args.push(
      '-c:v',
      'copy'
    );

  }

  else if (
    encoder === 'h264_qsv'
  ) {

    /*
     * KEIN:
     *
     * -hwaccel qsv
     * -hwaccel_output_format qsv
     *
     * Die Quelle wird von der CPU dekodiert.
     * QSV übernimmt ausschließlich das Encoding.
     */

    args.push(
      '-c:v',
      'h264_qsv',

      '-global_quality',
      String(
        qsvQuality
      ),

      '-preset',
      qsvPreset,

      '-pix_fmt',
      'nv12'
    );

  }

  else if (
    encoder === 'h264_amf'
  ) {

    args.push(
      '-c:v',
      'h264_amf',

      '-quality',
      amfQuality,

      '-rc',
      'cqp',

      '-qp_i',
      String(
        amfQP
      ),

      '-qp_p',
      String(
        amfQP
      ),

      '-qp_b',
      String(
        amfQP
      ),

      '-pix_fmt',
      'yuv420p'
    );

  }

  else if (
    encoder === 'h264_nvenc'
  ) {

    args.push(
      '-c:v',
      'h264_nvenc',

      '-cq',
      String(
        amfQP
      ),

      '-pix_fmt',
      'yuv420p'
    );
  }


  // ============================================================
  // HDR -> SDR
  // ============================================================

  if (
    needsHDRConversion
  ) {

    /*
     * HDR -> SDR Pipeline:
     *
     * 1. PQ/HLG -> linear
     * 2. Tonemap
     * 3. linear -> BT.709
     * 4. yuv420p
     */

    args.push(
      '-vf',

      'zscale=t=linear:npl=100,' +
      'tonemap=tonemap=hable:desat=0,' +
      'zscale=primaries=bt709:transfer=bt709:matrix=bt709,' +
      'format=yuv420p'
    );


    /*
     * Ganz wichtig:
     *
     * Nach dem Tonemapping werden die
     * Farbraum-Metadaten explizit auf SDR
     * BT.709 gesetzt.
     */

    args.push(
      '-color_primaries',
      'bt709',

      '-color_trc',
      'bt709',

      '-colorspace',
      'bt709'
    );
  }


  // ============================================================
  // AUDIO
  // ============================================================

  if (
    needsAudioTranscode
  ) {

    args.push(
      '-c:a:0',
      'aac',

      '-b:a:0',
      aacBitrate
    );


    if (
      outputAudioChannels > 0
    ) {

      args.push(
        '-ac:a:0',
        String(
          outputAudioChannels
        )
      );
    }

  }

  else {

    /*
     * Bereits AAC und Kanalzahl passt.
     * Daher Audio nicht erneut encodieren.
     */

    args.push(
      '-c:a:0',
      'copy'
    );
  }


  // ============================================================
  // AUDIO METADATA
  // ============================================================

  args.push(
    '-metadata:s:a:0',
    'language=de',

    '-disposition:a:0',
    'default'
  );


  // ============================================================
  // SUBTITLES
  // ============================================================

  selectedSubtitles.forEach(
    (subtitle, idx) => {

      args.push(
        '-map',
        `0:${subtitle.index}`,

        `-c:s:${idx}`,
        'copy'
      );
    }
  );


  // ============================================================
  // DATA STREAMS
  // ============================================================

  if (
    removeData
  ) {

    args.push(
      '-dn'
    );
  }


  // ============================================================
  // METADATA
  // ============================================================

  args.push(
    '-map_metadata',

    copyMetadata
      ? '0'
      : '-1'
  );


  // ============================================================
  // CHAPTERS
  // ============================================================

  args.push(
    '-map_chapters',

    copyChapters
      ? '0'
      : '-1'
  );


  // ============================================================
  // MUXING
  // ============================================================

  args.push(
    '-max_muxing_queue_size',
    '4096'
  );


  // ============================================================
  // RESPONSE
  // ============================================================

  response.preset =
    `<io> ${args.join(' ')}`;


  response.container =
    '.mkv';


  response.processFile =
    true;


  response.reQueueAfter =
    false;


  // ============================================================
  // DIAGNOSTIC LOG
  // ============================================================

  const hdrType =
    isHDR10
      ? 'HDR10'
      : isHLG
        ? 'HLG'
        : 'No HDR';


  const videoMode =
    copyVideo
      ? 'H.264 8-bit SDR -> COPY'
      : `${videoCodec || 'unknown'} -> H.264`;


  const audioMode =
    needsAudioTranscode
      ? `${germanAudioCodec || 'unknown'} -> AAC`
      : 'AAC -> COPY';


  let info =
    '========== CUSTOM H264 AAC 1.9.11 ==========\n';


  info +=
    `Node Name: ${
      currentNodeName ||
      'unknown'
    }\n`;


  info +=
    `Tdarr nodeHardwareType: ${
      rawNodeHardwareType ||
      'unknown'
    }\n`;


  info +=
    `Node Hardware Mapping: ${
      nodeHardwareMapping
    }\n`;


  info +=
    `Hardware mapping result: ${
      mappingDescription
    }\n`;


  info +=
    `Hardware vendor: ${
      hardwareVendor
    }\n`;


  info +=
    `Hardware encoder: ${
      encoder
    }\n`;


  info +=
    `Video stream: ${
      videoIndex
    }\n`;


  info +=
    `Video codec: ${
      videoCodec
    }\n`;


  info +=
    `Video profile: ${
      videoProfile ||
      'unknown'
    }\n`;


  info +=
    `Pixel format: ${
      pixelFormat ||
      'unknown'
    }\n`;


  info +=
    `Bit depth: ${
      bitDepth ||
      (is10Bit ? 10 : 8)
    }\n`;


  info +=
    `Resolution: ${
      width
    }x${
      height
    }\n`;


  info +=
    `Color transfer: ${
      colorTransfer ||
      'unknown'
    }\n`;


  info +=
    `Color primaries: ${
      colorPrimaries ||
      'unknown'
    }\n`;


  info +=
    `Color space: ${
      colorSpace ||
      'unknown'
    }\n`;


  info +=
    `HDR detected: ${
      isHDR
    }\n`;


  info +=
    `HDR type: ${
      hdrType
    }\n`;


  info +=
    `HDR mode: ${
      hdrMode
    }\n`;


  info +=
    `HDR action: ${
      needsHDRConversion
        ? 'HDR -> SDR Tonemap'
        : 'None'
    }\n`;


  info +=
    `Video decision: ${
      videoMode
    }\n`;


  info +=
    `Target codec: ${
      isTargetCodec
    }\n`;


  info +=
    `Needs video transcode: ${
      needsVideoTranscode
    }\n`;


  info +=
    'Hardware decoder: NONE (CPU decode)\n';


  info +=
    `QSV Quality: ${
      qsvQuality
    }\n`;


  info +=
    `QSV Preset: ${
      qsvPreset
    }\n`;


  info +=
    `AMF Quality: ${
      amfQuality
    }\n`;


  info +=
    `AMF QP: ${
      amfQP
    }\n`;


  info +=
    `Audio decision: ${
      audioMode
    }\n`;


  info +=
    `AAC bitrate: ${
      aacBitrate
    }\n`;


  info +=
    `Max Audio Channels: ${
      maxAudioChannels
    }\n`;


  info +=
    'Audio streams:\n';


  info +=
    `German audio: source ${
      germanAudioIndex
    } -> output audio:0, ` +
    `${
      germanAudioCodec
    }, ` +
    `${
      germanAudioChannels
    } -> ` +
    `${
      outputAudioChannels
    } Kanäle\n`;


  info +=
    `Audio output map: -map 0:${
      germanAudioIndex
    }\n`;


  info +=
    `Subtitle Mode: ${
      subtitleMode
    }\n`;


  info +=
    `Selected subtitles: ${
      selectedSubtitles.length
    }\n`;


  info +=
    `Data streams removed: ${
      removeData
    }\n`;


  info +=
    `Metadata copied: ${
      copyMetadata
    }\n`;


  info +=
    `Chapters copied: ${
      copyChapters
    }\n`;


  info +=
    '==========================================\n';


  info +=
    'FFmpeg Output Flags:\n';


  info +=
    args.join(' ');


  info +=
    '\n==========================================\n';


  response.infoLog =
    info;


  return response;
};


// ================================================================
// EXPORTS
// ================================================================

module.exports.details =
  details;


module.exports.plugin =
  plugin;
