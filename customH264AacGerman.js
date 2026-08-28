/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

/*
 * Tdarr Classic Plugin
 *
 * customH264AacGerman
 *
 * Version 1.9.1
 *
 * Ziel:
 * - HEVC / AV1 / MPEG-4 -> H.264
 * - H.264 8-bit wird nach Möglichkeit kopiert
 * - Intel QSV auf QSV-Nodes
 * - AMD AMF auf AMF-Nodes
 * - CPU Decode, KEIN Hardware Decode
 * - HDR10/HLG -> SDR BT.709
 * - deutsche Audiospur -> AAC
 * - maximale Audiokanäle konfigurierbar
 * - Untertitel über Subtitle Mode steuerbar
 * - Datenstreams werden entfernt
 * - Metadaten und Kapitel können übernommen werden
 *
 * WICHTIG:
 *
 * Tdarr übergibt den sichtbaren Node-Namen bei diesem Plugin
 * nicht zuverlässig in otherArguments.
 *
 * Deshalb wird in 1.9.1 der von Tdarr bereitgestellte
 * nodeHardwareType verwendet.
 *
 * Beispiel:
 *
 * Keller-Node -> nodeHardwareType = qsv
 * Windows-AMD -> nodeHardwareType = amf
 *
 * Die Einstellung "Node Hardware Mapping" bleibt bestehen,
 * damit die Zuordnung zentral konfiguriert werden kann.
 */

const details = () => ({
  id: 'customH264AacGerman',

  Stage: 'Pre-processing',

  Name: 'H.264 AAC Direct Play (QSV/AMF)',

  Type: 'Video',

  Operation: 'Transcode',

  Description:
    'Erzeugt H.264 8-bit für maximale Direct-Play-Kompatibilität. ' +
    'Verwendet Intel QSV oder AMD AMF abhängig vom Tdarr Node. ' +
    'HDR wird optional nach SDR BT.709 konvertiert. ' +
    'Deutsche Audiospuren werden nach AAC konvertiert.',

  Version: '1.9.1',

  Tags:
    'h264,qsv,amf,aac,german,hdr,directplay,node-mapping',

  Inputs: [

    // ============================================================
    // TARGET CODECS
    // ============================================================

    {
      name: 'Target Video Codecs',

      type: 'string',

      defaultValue: 'hevc,av1,mpeg4',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Kommagetrennte Video-Codecs, die nach H.264 konvertiert werden. ' +
        'Beispiel: hevc,av1,mpeg4',
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
        'Zuordnung der Tdarr-Nodes zu Hardware. ' +
        'Format: NodeName=qsv,NodeName=amf. ' +
        'Die Einstellung dient zur Dokumentation und Konfiguration. ' +
        'Die tatsächliche Hardware wird über Tdarr nodeHardwareType erkannt.',
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
        'Niedriger = bessere Qualität / größere Datei. ' +
        '18 ist ein guter Ausgangswert.',
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
    // AMD AMF
    // ============================================================

    {
      name: 'AMF Quality',

      type: 'string',

      defaultValue: 'quality',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AMD AMF Qualitätsmodus.',
    },


    {
      name: 'AMF QP',

      type: 'number',

      defaultValue: 20,

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AMD AMF CQP Wert. ' +
        'Niedriger = bessere Qualität / größere Datei.',
    },


    // ============================================================
    // AUDIO
    // ============================================================

    {
      name: 'AAC Bitrate',

      type: 'string',

      defaultValue: '192k',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'AAC Bitrate. Beispiel: 192k, 256k, 320k.',
    },


    {
      name: 'Max Audio Channels',

      type: 'number',

      defaultValue: 6,

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Maximale Audiokanäle. 6 = 5.1. ' +
        'Eine Quelle mit weniger Kanälen wird nicht hochgerechnet.',
    },


    // ============================================================
    // GERMAN LANGUAGE
    // ============================================================

    {
      name: 'German Languages',

      type: 'string',

      defaultValue:
        'ger,de,deu,german',

      inputUI: {
        type: 'text',
      },

      tooltip:
        'Akzeptierte deutsche Sprach-Tags.',
    },


    // ============================================================
    // SUBTITLE MODE
    // ============================================================

    {
      name: 'Subtitle Mode',

      type: 'string',

      defaultValue:
        'Deutsche Forced behalten',

      inputUI: {
        type: 'dropdown',

        options: [
          'Alle entfernen',
          'Deutsche behalten',
          'Deutsche Forced behalten',
          'Alle behalten',
        ],
      },

      tooltip:
        'Legt fest, welche Untertitel übernommen werden.',
    },


    // ============================================================
    // HDR MODE
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
          'Keep HDR metadata',
        ],
      },

      tooltip:
        'HDR nach SDR konvertieren oder HDR-Metadaten beibehalten. ' +
        'Für maximale Webclient-Kompatibilität wird Convert HDR to SDR empfohlen.',
    },


    // ============================================================
    // DATA
    // ============================================================

    {
      name: 'Remove Data Streams',

      type: 'boolean',

      defaultValue: true,

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


    // ============================================================
    // METADATA
    // ============================================================

    {
      name: 'Copy Metadata',

      type: 'boolean',

      defaultValue: true,

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


    // ============================================================
    // CHAPTERS
    // ============================================================

    {
      name: 'Copy Chapters',

      type: 'boolean',

      defaultValue: true,

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

  ],
});


/* ================================================================
 * HELPER
 * ================================================================ */

function boolValue(value, defaultValue) {

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return defaultValue;
}


/* ================================================================
 * PARSE NODE HARDWARE MAPPING
 * ================================================================ */

function parseHardwareMapping(mapping) {

  const result = {};

  const entries =
    String(mapping || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);


  for (const entry of entries) {

    const separator =
      entry.indexOf('=');


    if (separator === -1) {
      continue;
    }


    const nodeName =
      entry
        .substring(
          0,
          separator
        )
        .trim();


    const hardware =
      entry
        .substring(
          separator + 1
        )
        .trim()
        .toLowerCase();


    if (
      nodeName &&
      hardware
    ) {

      result[
        nodeName.toLowerCase()
      ] = hardware;

    }

  }


  return result;
}


/* ================================================================
 * NORMALIZE HARDWARE TYPE
 * ================================================================ */

function normalizeHardwareType(value) {

  const type =
    String(value || '')
      .trim()
      .toLowerCase();


  if (
    type === 'qsv' ||
    type === 'intel' ||
    type === 'intel_qsv'
  ) {

    return 'qsv';

  }


  if (
    type === 'amf' ||
    type === 'amd' ||
    type === 'amd_amf'
  ) {

    return 'amf';

  }


  if (
    type === 'nvenc' ||
    type === 'nvidia' ||
    type === 'nvidia_nvenc'
  ) {

    return 'nvenc';

  }


  return '';

}


/* ================================================================
 * PLUGIN
 * ================================================================ */

const plugin = (
  file,
  librarySettings,
  inputs,
  otherArguments
) => {

  const response = {

    processFile: false,

    preset: '',

    container: '.mkv',

    handBrakeMode: false,

    FFmpegMode: true,

    reQueueAfter: false,

    infoLog: '',

  };


  // ==============================================================
  // SETTINGS
  // ==============================================================

  const targetVideoCodecs =
    String(
      inputs['Target Video Codecs']
      || 'hevc,av1,mpeg4'
    )
      .split(',')
      .map(
        (x) =>
          x.trim().toLowerCase()
      )
      .filter(
        (x) =>
          x.length > 0
      );


  const nodeHardwareMapping =
    String(
      inputs['Node Hardware Mapping']
      || 'Keller-Node=qsv,Windows-AMD=amf'
    );


  const qsvQuality =
    Number(
      inputs['QSV Quality']
      || 18
    );


  const qsvPreset =
    String(
      inputs['QSV Preset']
      || 'medium'
    ).trim();


  const amfQuality =
    String(
      inputs['AMF Quality']
      || 'quality'
    ).trim();


  const amfQP =
    Number(
      inputs['AMF QP']
      || 20
    );


  const aacBitrate =
    String(
      inputs['AAC Bitrate']
      || '192k'
    ).trim();


  const maxAudioChannels =
    Math.max(
      1,
      Number(
        inputs['Max Audio Channels']
        || 6
      )
    );


  const germanLanguages =
    String(
      inputs['German Languages']
      || 'ger,de,deu,german'
    )
      .split(',')
      .map(
        (x) =>
          x.trim().toLowerCase()
      )
      .filter(
        (x) =>
          x.length > 0
      );


  const subtitleMode =
    String(
      inputs['Subtitle Mode']
      || 'Deutsche Forced behalten'
    ).trim();


  const hdrMode =
    String(
      inputs['HDR Mode']
      || 'Convert HDR to SDR'
    ).trim();


  const removeData =
    boolValue(
      inputs['Remove Data Streams'],
      true
    );


  const copyMetadata =
    boolValue(
      inputs['Copy Metadata'],
      true
    );


  const copyChapters =
    boolValue(
      inputs['Copy Chapters'],
      true
    );


  // ==============================================================
  // BASIC CHECK
  // ==============================================================

  if (
    !file ||
    file.fileMedium !== 'video'
  ) {

    response.infoLog =
      'Datei ist kein Video. Datei wird übersprungen.';

    return response;

  }


  // ==============================================================
  // NODE HARDWARE TYPE
  // ==============================================================

  /*
   * DAS ist der entscheidende Unterschied zu 1.9.0.
   *
   * Der sichtbare Tdarr Node-Name steht nicht zuverlässig
   * in otherArguments.
   *
   * Tdarr stellt jedoch nodeHardwareType bereit.
   */

  const rawNodeHardwareType =
    String(
      otherArguments &&
      otherArguments.nodeHardwareType
        ? otherArguments.nodeHardwareType
        : ''
    );


  const nodeHardwareType =
    normalizeHardwareType(
      rawNodeHardwareType
    );


  const mapping =
    parseHardwareMapping(
      nodeHardwareMapping
    );


  // ==============================================================
  // HARDWARE AUSWÄHLEN
  // ==============================================================

  let encoder =
    '';


  let hardwareVendor =
    '';


  let mappingDescription =
    '';


  /*
   * Primär wird nodeHardwareType verwendet.
   */

  if (
    nodeHardwareType === 'qsv'
  ) {

    encoder =
      'h264_qsv';

    hardwareVendor =
      'Intel QSV';

    mappingDescription =
      'Tdarr nodeHardwareType=qsv';

  } else if (
    nodeHardwareType === 'amf'
  ) {

    encoder =
      'h264_amf';

    hardwareVendor =
      'AMD AMF';

    mappingDescription =
      'Tdarr nodeHardwareType=amf';

  } else if (
    nodeHardwareType === 'nvenc'
  ) {

    encoder =
      'h264_nvenc';

    hardwareVendor =
      'NVIDIA NVENC';

    mappingDescription =
      'Tdarr nodeHardwareType=nvenc';

  }


  // ==============================================================
  // UNSICHERES HARDWARE MAPPING
  // ==============================================================

  /*
   * Kein Fallback auf QSV!
   *
   * Das ist absichtlich so.
   *
   * Wenn Tdarr beispielsweise einen neuen Node-Typ liefert,
   * darf das Plugin nicht versehentlich auf dem falschen
   * Encoder laufen.
   */

  if (!encoder) {

    response.infoLog =
      '========== CUSTOM H264 AAC 1.9.1 ==========\n'
      + 'Node Hardware Type konnte nicht eindeutig bestimmt werden.\n'
      + `Tdarr nodeHardwareType: ${rawNodeHardwareType || 'unknown'}\n`
      + `Normalisiert: ${nodeHardwareType || 'unknown'}\n`
      + `Node Hardware Mapping: ${nodeHardwareMapping}\n`
      + '\n'
      + 'Unterstützt werden:\n'
      + 'qsv = Intel QSV\n'
      + 'amf = AMD AMF\n'
      + 'nvenc = NVIDIA NVENC\n'
      + '\n'
      + 'Datei wird aus Sicherheitsgründen übersprungen.\n';

    response.processFile =
      false;

    return response;

  }


  // ==============================================================
  // FFPROBE
  // ==============================================================

  if (
    !file.ffProbeData ||
    !Array.isArray(
      file.ffProbeData.streams
    )
  ) {

    response.infoLog =
      'FFprobe-Daten fehlen. Datei wird übersprungen.';

    return response;

  }


  const streams =
    file.ffProbeData.streams;


  // ==============================================================
  // VIDEO
  // ==============================================================

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


    const codecType =
      String(
        stream.codec_type || ''
      ).toLowerCase();


    const codec =
      String(
        stream.codec_name || ''
      ).toLowerCase();


    if (
      codecType === 'video' &&
      codec !== 'mjpeg' &&
      codec !== 'png' &&
      codec !== 'bmp'
    ) {

      videoStream =
        stream;

      videoIndex =
        i;

      break;

    }

  }


  if (!videoStream) {

    response.infoLog =
      'Kein verwendbarer Videostream gefunden.';

    return response;

  }


  const videoCodec =
    String(
      videoStream.codec_name || ''
    ).toLowerCase();


  const videoProfile =
    String(
      videoStream.profile || ''
    ).toLowerCase();


  const pixelFormat =
    String(
      videoStream.pix_fmt || ''
    ).toLowerCase();


  const width =
    Number(
      videoStream.width || 0
    );


  const height =
    Number(
      videoStream.height || 0
    );


  // ==============================================================
  // BIT DEPTH
  // ==============================================================

  const bitDepth =
    Number(
      videoStream.bits_per_raw_sample
      || 0
    );


  const is10Bit =
    bitDepth >= 10
    || pixelFormat.includes('10')
    || pixelFormat.includes('12')
    || pixelFormat.includes('p010')
    || pixelFormat.includes('p012')
    || pixelFormat.includes('p016')
    || videoProfile.includes('10');


  const isH264 =
    videoCodec === 'h264';


  const isH264EightBit =
    isH264 &&
    !is10Bit &&
    pixelFormat !== 'yuv422p' &&
    pixelFormat !== 'yuv444p';


  // ==============================================================
  // HDR
  // ==============================================================

  const colorTransfer =
    String(
      videoStream.color_transfer || ''
    ).toLowerCase();


  const colorPrimaries =
    String(
      videoStream.color_primaries || ''
    ).toLowerCase();


  const colorSpace =
    String(
      videoStream.color_space || ''
    ).toLowerCase();


  const isHDR10 =
    colorTransfer === 'smpte2084';


  const isHLG =
    colorTransfer === 'arib-std-b67';


  const isHDR =
    isHDR10 ||
    isHLG ||
    colorPrimaries === 'bt2020' ||
    colorSpace === 'bt2020nc';


  const convertHDRToSDR =
    hdrMode ===
    'Convert HDR to SDR';


  const needsHDRConversion =
    isHDR &&
    convertHDRToSDR;


  // ==============================================================
  // AUDIO
  // ==============================================================

  const audioStreams =
    streams.filter(
      (stream) =>
        String(
          stream.codec_type || ''
        ).toLowerCase() === 'audio'
    );


  if (
    audioStreams.length === 0
  ) {

    response.infoLog =
      'Keine Audiospur gefunden.';

    return response;

  }


  // ==============================================================
  // GERMAN AUDIO
  // ==============================================================

  let germanAudio =
    null;


  let germanAudioIndex =
    -1;


  for (
    let i = 0;
    i < audioStreams.length;
    i++
  ) {

    const stream =
      audioStreams[i];


    const tags =
      stream.tags || {};


    const language =
      String(
        tags.language
        || tags.LANGUAGE
        || tags.lang
        || tags.LANG
        || stream.language
        || ''
      )
        .toLowerCase()
        .trim();


    if (
      germanLanguages.includes(
        language
      )
    ) {

      germanAudio =
        stream;

      germanAudioIndex =
        streams.indexOf(
          stream
        );

      break;

    }

  }


  if (!germanAudio) {

    response.infoLog =
      'Keine deutsche Audiospur gefunden.\n'
      + `Erlaubte Sprachen: ${germanLanguages.join(', ')}\n`
      + 'Datei wird übersprungen, um nicht versehentlich eine andere Sprache zu verwenden.';

    return response;

  }


  const germanAudioCodec =
    String(
      germanAudio.codec_name || ''
    ).toLowerCase();


  const germanAudioChannels =
    Number(
      germanAudio.channels || 0
    );


  // ==============================================================
  // SUBTITLES
  // ==============================================================

  const subtitleStreams =
    streams.filter(
      (stream) =>
        String(
          stream.codec_type || ''
        ).toLowerCase() === 'subtitle'
    );


  const selectedSubtitles =
    [];


  for (
    let i = 0;
    i < subtitleStreams.length;
    i++
  ) {

    const subtitle =
      subtitleStreams[i];


    const tags =
      subtitle.tags || {};


    const language =
      String(
        tags.language
        || tags.LANGUAGE
        || tags.lang
        || tags.LANG
        || subtitle.language
        || ''
      )
        .toLowerCase()
        .trim();


    const forced =
      subtitle.disposition &&
      Number(
        subtitle.disposition.forced
      ) === 1;


    if (
      subtitleMode ===
      'Alle behalten'
    ) {

      selectedSubtitles.push(
        subtitle
      );

    } else if (
      subtitleMode ===
      'Deutsche behalten'
    ) {

      if (
        germanLanguages.includes(
          language
        )
      ) {

        selectedSubtitles.push(
          subtitle
        );

      }

    } else if (
      subtitleMode ===
      'Deutsche Forced behalten'
    ) {

      if (
        germanLanguages.includes(
          language
        ) &&
        forced
      ) {

        selectedSubtitles.push(
          subtitle
        );

      }

    }

  }


  // ==============================================================
  // VIDEO CODEC ENTSCHEIDEN
  // ==============================================================

  const targetCodec =
    targetVideoCodecs.includes(
      videoCodec
    );


  /*
   * H.264 8-bit:
   *
   * Kein Video-Reencode notwendig.
   */

  const copyVideo =
    isH264EightBit &&
    !needsHDRConversion;


  // ==============================================================
  // FFMPEG ARGUMENTE
  // ==============================================================

  const args =
    [];


  // --------------------------------------------------------------
  // VIDEO MAP
  // --------------------------------------------------------------

  args.push(
    '-map',
    `0:${videoIndex}`
  );


  // --------------------------------------------------------------
  // VIDEO ENCODING
  // --------------------------------------------------------------

  if (
    copyVideo
  ) {

    args.push(
      '-c:v',
      'copy'
    );

  } else {

    /*
     * Wenn das Video nicht H.264 ist oder HDR
     * nach SDR konvertiert werden muss,
     * wird neu encodiert.
     */

    args.push(
      '-c:v',
      encoder
    );


    // ------------------------------------------------------------
    // QSV
    // ------------------------------------------------------------

    if (
      encoder === 'h264_qsv'
    ) {

      args.push(
        '-global_quality',
        String(
          qsvQuality
        )
      );


      args.push(
        '-preset',
        qsvPreset
      );

    }


    // ------------------------------------------------------------
    // AMD AMF
    // ------------------------------------------------------------

    if (
      encoder === 'h264_amf'
    ) {

      args.push(
        '-quality',
        amfQuality
      );


      args.push(
        '-rc',
        'cqp'
      );


      args.push(
        '-qp_i',
        String(
          amfQP
        )
      );


      args.push(
        '-qp_p',
        String(
          amfQP
        )
      );


      args.push(
        '-qp_b',
        String(
          amfQP
        )
      );

    }


    // ------------------------------------------------------------
    // NVIDIA
    // ------------------------------------------------------------

    if (
      encoder === 'h264_nvenc'
    ) {

      args.push(
        '-cq',
        String(
          qsvQuality
        )
      );


      args.push(
        '-preset',
        'p5'
      );

    }


    // ------------------------------------------------------------
    // HDR -> SDR
    // ------------------------------------------------------------

    if (
      needsHDRConversion
    ) {

      args.push(
        '-vf',
        'zscale=t=linear:npl=100,'
        + 'tonemap=tonemap=hable:desat=0,'
        + 'zscale=primaries=bt709:transfer=bt709:matrix=bt709,'
        + 'format=yuv420p'
      );

    } else {

      /*
       * Bei neu encodiertem SDR erzwingen wir
       * 8-bit 4:2:0.
       */

      args.push(
        '-pix_fmt',
        'yuv420p'
      );

    }

  }


  // ==============================================================
  // AUDIO
  // ==============================================================

  args.push(
    '-map',
    `0:${germanAudioIndex}`
  );


  args.push(
    '-c:a:0',
    'aac'
  );


  args.push(
    '-b:a:0',
    aacBitrate
  );


  /*
   * Nicht mehr Kanäle als konfiguriert.
   *
   * Eine 2-Kanal-Quelle wird nicht künstlich auf 6 Kanäle
   * hochgerechnet.
   */

  if (
    germanAudioChannels > 0
    && germanAudioChannels >
      maxAudioChannels
  ) {

    args.push(
      '-ac:0',
      String(
        maxAudioChannels
      )
    );

  }


  // ==============================================================
  // SUBTITLES
  // ==============================================================

  for (
    let i = 0;
    i < selectedSubtitles.length;
    i++
  ) {

    const subtitle =
      selectedSubtitles[i];


    const subtitleIndex =
      streams.indexOf(
        subtitle
      );


    args.push(
      '-map',
      `0:${subtitleIndex}`
    );


    args.push(
      `-c:s:${i}`,
      'copy'
    );

  }


  // ==============================================================
  // DATA
  // ==============================================================

  if (
    removeData
  ) {

    args.push(
      '-dn'
    );

  }


  // ==============================================================
  // METADATA
  // ==============================================================

  if (
    copyMetadata
  ) {

    args.push(
      '-map_metadata',
      '0'
    );

  } else {

    args.push(
      '-map_metadata',
      '-1'
    );

  }


  // ==============================================================
  // CHAPTERS
  // ==============================================================

  if (
    copyChapters
  ) {

    args.push(
      '-map_chapters',
      '0'
    );

  } else {

    args.push(
      '-map_chapters',
      '-1'
    );

  }


  // ==============================================================
  // OUTPUT
  // ==============================================================

  response.container =
    '.mkv';


  response.preset =
    `, ${args.join(' ')}`;


  response.processFile =
    true;


  // ==============================================================
  // INFO LOG
  // ==============================================================

  let info =
    '========== CUSTOM H264 AAC 1.9.1 ==========\n';


  info +=
    `Tdarr nodeHardwareType: ${rawNodeHardwareType || 'unknown'}\n`;


  info +=
    `Hardware mapping: ${nodeHardwareMapping}\n`;


  info +=
    `Hardware mapping result: ${mappingDescription}\n`;


  info +=
    `Hardware vendor: ${hardwareVendor}\n`;


  info +=
    `Hardware encoder: ${encoder}\n`;


  info +=
    `Video stream: ${videoIndex}\n`;


  info +=
    `Video codec: ${videoCodec}\n`;


  info +=
    `Video profile: ${videoProfile || 'unknown'}\n`;


  info +=
    `Pixel format: ${pixelFormat || 'unknown'}\n`;


  info +=
    `Bit depth: ${bitDepth || (is10Bit ? 10 : 8)}\n`;


  info +=
    `Resolution: ${width}x${height}\n`;


  info +=
    `Target codec: ${targetCodec}\n`;


  info +=
    `Video mode: ${copyVideo ? 'H.264 copy' : `${videoCodec} -> H.264`}\n`;


  info +=
    `HDR detected: ${isHDR}\n`;


  if (
    isHDR10
  ) {

    info +=
      'HDR type: HDR10\n';

  } else if (
    isHLG
  ) {

    info +=
      'HDR type: HLG\n';

  } else if (
    isHDR
  ) {

    info +=
      'HDR type: HDR\n';

  } else {

    info +=
      'HDR type: No HDR\n';

  }


  if (
    needsHDRConversion
  ) {

    info +=
      'HDR action: HDR -> SDR Tonemap\n';

  } else {

    info +=
      'HDR action: None\n';

  }


  info +=
    'Hardware decoder: NONE (CPU decode)\n';


  info +=
    `QSV Quality: ${qsvQuality}\n`;


  info +=
    `QSV Preset: ${qsvPreset}\n`;


  info +=
    `AMF Quality: ${amfQuality}\n`;


  info +=
    `AMF QP: ${amfQP}\n`;


  info +=
    `AAC bitrate: ${aacBitrate}\n`;


  info +=
    `Max Audio Channels: ${maxAudioChannels}\n`;


  info +=
    'Audio streams:\n';


  info +=
    `German audio: ${germanAudioIndex}, `
    + `${germanAudioCodec}, `
    + `${germanAudioChannels} Kanäle\n`;


  info +=
    `Subtitle Mode: ${subtitleMode}\n`;


  info +=
    `Selected subtitles: ${selectedSubtitles.length}\n`;


  info +=
    `Data streams removed: ${removeData}\n`;


  info +=
    `Metadata copied: ${copyMetadata}\n`;


  info +=
    `Chapters copied: ${copyChapters}\n`;


  info +=
    '==========================================\n';


  info +=
    'FFmpeg Output Flags:\n';


  info +=
    args.join(' ');


  info +=
    '\n';


  info +=
    '==========================================\n';


  response.infoLog =
    info;


  return response;
};


/* ================================================================
 * EXPORT
 * ================================================================ */

module.exports.details =
  details;

module.exports.plugin =
  plugin;
