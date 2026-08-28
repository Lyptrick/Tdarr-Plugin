module.exports.details = function details() {
  return {
    id: 'customH264AacGerman',
    Stage: 'Pre-processing',
    Name: 'HEVC/AV1/MPEG-4/HDR zu H.264 AAC German (QSV)',
    Type: 'Video',
    Operation: 'Transcode',
    Description:
      'Erzeugt eine möglichst Jellyfin-kompatible H.264-8-bit-SDR-Datei. Ausgewählte Video-Codecs werden nach H.264 QSV konvertiert. HDR kann automatisch nach SDR getonemapped werden. Deutsche Audiospuren werden zu AAC konvertiert.',
    Version: '1.7.0',
    Tags: 'qsv,h264,aac,german,hdr,sdr',
    Inputs: [
      {
        name: 'Target Video Codecs',
        type: 'string',
        defaultValue: 'hevc,av1,mpeg4',
        inputUI: { type: 'text' },
        tooltip:
          'Kommagetrennte Video-Codecs, die nach H.264 konvertiert werden. Beispiele: hevc,av1,mpeg4 oder nur av1.',
      },

      {
        name: 'HDR Mode',
        type: 'string',
        defaultValue: 'Convert HDR to SDR (Direct Play)',
        inputUI: {
          type: 'dropdown',
          options: [
            'Convert HDR to SDR (Direct Play)',
            'Keep HDR',
          ],
        },
        tooltip:
          'Legt fest, ob HDR automatisch nach SDR getonemapped wird. Für maximale Jellyfin-Web-Direct-Play-Kompatibilität wird Convert HDR to SDR empfohlen.',
      },

      {
        name: 'QSV Quality',
        type: 'number',
        defaultValue: 18,
        inputUI: { type: 'text' },
        tooltip:
          'QSV Qualität. Niedriger = bessere Qualität und größere Datei. Empfohlen: 18-23.',
      },

      {
        name: 'QSV Preset',
        type: 'string',
        defaultValue: 'medium',
        inputUI: { type: 'text' },
        tooltip:
          'QSV Preset, z.B. veryfast, faster, fast, medium oder slow.',
      },

      {
        name: 'AAC Bitrate',
        type: 'string',
        defaultValue: '192k',
        inputUI: { type: 'text' },
        tooltip:
          'AAC Bitrate, z.B. 160k, 192k oder 256k.',
      },

      {
        name: 'Max Audio Channels',
        type: 'number',
        defaultValue: 6,
        inputUI: { type: 'text' },
        tooltip:
          'Maximale Anzahl Audiokanäle. Eine Quelle mit weniger Kanälen wird nicht hochgerechnet.',
      },

      {
        name: 'German Languages',
        type: 'string',
        defaultValue: 'ger,de,deu,german',
        inputUI: { type: 'text' },
        tooltip:
          'Kommagetrennte Sprachcodes für deutsche Audiospuren.',
      },

      {
        name: 'Subtitle Mode',
        type: 'string',
        defaultValue: 'German Forced',
        inputUI: {
          type: 'dropdown',
          options: [
            'Remove All',
            'Keep German',
            'German Forced',
            'Keep All',
          ],
        },
        tooltip:
          'Legt fest, welche Untertitel übernommen werden.',
      },

      {
        name: 'Remove Data Streams',
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: ['true', 'false'],
        },
        tooltip:
          'Data Streams entfernen.',
      },

      {
        name: 'Copy Metadata',
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: ['true', 'false'],
        },
        tooltip:
          'Metadaten übernehmen.',
      },

      {
        name: 'Copy Chapters',
        type: 'boolean',
        defaultValue: true,
        inputUI: {
          type: 'dropdown',
          options: ['true', 'false'],
        },
        tooltip:
          'Kapitel übernehmen.',
      },
    ],
  };
};


module.exports.plugin = function plugin(
  file,
  librarySettings,
  inputs,
  otherArguments
) {
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv',
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };


  // ============================================================
  // EINSTELLUNGEN
  // ============================================================

  const targetVideoCodecs = String(
    inputs['Target Video Codecs'] || 'hevc,av1,mpeg4'
  )
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0);


  const hdrMode = String(
    inputs['HDR Mode'] ||
      'Convert HDR to SDR (Direct Play)'
  ).trim();


  const qsvQuality = Number(
    inputs['QSV Quality'] || 18
  );


  const qsvPreset = String(
    inputs['QSV Preset'] || 'medium'
  ).trim();


  const aacBitrate = String(
    inputs['AAC Bitrate'] || '192k'
  ).trim();


  const maxAudioChannels = Math.max(
    1,
    Number(
      inputs['Max Audio Channels'] || 6
    )
  );


  const germanLanguages = String(
    inputs['German Languages'] ||
      'ger,de,deu,german'
  )
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0);


  const subtitleMode = String(
    inputs['Subtitle Mode'] ||
      'German Forced'
  ).trim();


  const removeData =
    inputs['Remove Data Streams'] !== false &&
    String(
      inputs['Remove Data Streams']
    ) !== 'false';


  const copyMetadata =
    inputs['Copy Metadata'] !== false &&
    String(
      inputs['Copy Metadata']
    ) !== 'false';


  const copyChapters =
    inputs['Copy Chapters'] !== false &&
    String(
      inputs['Copy Chapters']
    ) !== 'false';


  // ============================================================
  // FFPROBE PRÜFEN
  // ============================================================

  if (
    !file.ffProbeData ||
    !file.ffProbeData.streams
  ) {
    response.infoLog =
      'FFprobe-Daten fehlen. Datei wird übersprungen.';
    return response;
  }


  const streams =
    file.ffProbeData.streams;


  // ============================================================
  // VIDEO STREAM SUCHEN
  // ============================================================

  const videoStream =
    streams.find(
      (stream) =>
        stream.codec_type === 'video'
    );


  if (!videoStream) {
    response.infoLog =
      'Kein Videostream gefunden.';
    return response;
  }


  const videoIndex =
    videoStream.index;


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
    videoStream.width || 0;


  const height =
    videoStream.height || 0;


  const bitDepth =
    Number(
      videoStream.bits_per_raw_sample ||
        0
    );


  // ============================================================
  // HDR ERKENNUNG
  // ============================================================

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


  const isHDR =
    colorTransfer === 'smpte2084' ||
    colorTransfer === 'arib-std-b67' ||
    colorPrimaries === 'bt2020' ||
    colorSpace === 'bt2020nc';


  const isHDR10 =
    colorTransfer === 'smpte2084';


  const isHLG =
    colorTransfer === 'arib-std-b67';


  const convertHDRToSDR =
    hdrMode ===
      'Convert HDR to SDR (Direct Play)';


  const needsHDRConversion =
    isHDR &&
    convertHDRToSDR;


  // ============================================================
  // AUDIO STREAMS
  // ============================================================

  const audioStreams =
    streams.filter(
      (stream) =>
        stream.codec_type === 'audio'
    );


  if (
    audioStreams.length === 0
  ) {
    response.infoLog =
      'Keine Audiospur gefunden.';
    return response;
  }


  // ============================================================
  // DEUTSCHE AUDIOSPUREN
  // ============================================================

  const germanAudioStreams =
    audioStreams.filter(
      (stream) => {
        const language =
          (
            stream.tags &&
            (
              stream.tags.language ||
              stream.tags.LANGUAGE
            )
          ) || '';

        return germanLanguages.includes(
          String(
            language
          ).toLowerCase()
        );
      }
    );


  if (
    germanAudioStreams.length === 0
  ) {
    response.infoLog =
      'Keine deutsche Audiospur gefunden. Datei wird übersprungen.';
    return response;
  }


  // ============================================================
  // AUDIO ÄNDERUNG ERFORDERLICH?
  // ============================================================

  let audioNeedsProcessing =
    false;


  germanAudioStreams.forEach(
    (audioStream) => {
      const audioCodec =
        String(
          audioStream.codec_name || ''
        ).toLowerCase();


      if (
        audioCodec !== 'aac'
      ) {
        audioNeedsProcessing = true;
      }
    }
  );


  // ============================================================
  // UNTERTITEL
  // ============================================================

  const subtitleStreams =
    streams.filter(
      (stream) =>
        stream.codec_type === 'subtitle'
    );


  const selectedSubtitleStreams =
    [];


  subtitleStreams.forEach(
    (subtitleStream) => {
      const language =
        (
          subtitleStream.tags &&
          (
            subtitleStream.tags.language ||
            subtitleStream.tags.LANGUAGE
          )
        ) || '';


      const languageLower =
        String(
          language
        ).toLowerCase();


      const forced =
        subtitleStream.disposition &&
        (
          subtitleStream.disposition.forced === 1 ||
          subtitleStream.disposition.forced === true
        );


      let keep = false;


      switch (subtitleMode) {
        case 'Remove All':
          keep = false;
          break;


        case 'Keep German':
          keep =
            germanLanguages.includes(
              languageLower
            );
          break;


        case 'German Forced':
          keep =
            germanLanguages.includes(
              languageLower
            ) && forced;
          break;


        case 'Keep All':
          keep = true;
          break;


        default:
          keep =
            germanLanguages.includes(
              languageLower
            ) && forced;
          break;
      }


      if (keep) {
        selectedSubtitleStreams.push(
          subtitleStream
        );
      }
    }
  );


  // ============================================================
  // VIDEO ENTSCHEIDUNG
  // ============================================================

  let videoNeedsEncoding = false;

  let videoMode =
    'copy';


  /*
   * H.264:
   *
   * SDR:
   *   Video kann direkt kopiert werden.
   *
   * HDR + HDR->SDR:
   *   Video muss getonemapped und
   *   anschließend als H.264 encodiert werden.
   *
   * Andere Codecs:
   *   Nur wenn in Target Video Codecs
   *   enthalten -> H.264 Encoding.
   */


  if (
    videoCodec === 'h264'
  ) {
    if (
      needsHDRConversion
    ) {
      videoNeedsEncoding = true;
      videoMode =
        'H.264 HDR -> SDR';
    } else {
      videoNeedsEncoding = false;
      videoMode =
        'H.264 copy';
    }
  } else {
    if (
      !targetVideoCodecs.includes(
        videoCodec
      )
    ) {
      response.infoLog =
        `Video-Codec "${videoCodec}" steht nicht in der Liste der ` +
        `zu konvertierenden Codecs (${targetVideoCodecs.join(', ')}). ` +
        'Datei wird übersprungen.';

      return response;
    }

    videoNeedsEncoding = true;
    videoMode =
      `${videoCodec} -> H.264`;
  }


  // ============================================================
  // PRÜFEN, OB ÜBERHAUPT ETWAS ZU TUN IST
  // ============================================================

  /*
   * Wenn H.264 SDR bereits vorhanden ist,
   * Audio bereits AAC ist und keine
   * Subtitle-Änderung notwendig ist,
   * muss die Datei nicht verarbeitet werden.
   *
   * Da der Flow aber nur ausgewählte
   * Dateien erreicht, können wir bei
   * vorhandenen Untertiteln nicht ohne
   * Weiteres feststellen, ob sie bereits
   * dem gewünschten Mode entsprechen.
   *
   * Deshalb wird bei H.264 SDR mit
   * vorhandenen Untertiteln weitergemappt.
   */


  if (
    videoCodec === 'h264' &&
    !needsHDRConversion &&
    !audioNeedsProcessing &&
    subtitleMode === 'Keep All' &&
    !removeData
  ) {
    response.infoLog =
      'H.264 SDR, deutsche Audiospur bereits AAC und keine Stream-Änderung erforderlich. Datei wird übersprungen.';
    return response;
  }


  // ============================================================
  // FFMPEG ARGUMENTE
  // ============================================================

  const outputArgs = [];


  // ============================================================
  // VIDEO MAPPING
  // ============================================================

  /*
   * WICHTIG:
   *
   * Es wird bewusst nur EIN Videostream
   * gemappt.
   *
   * Dadurch ist H.264 garantiert
   * Video-Stream 0 der Ausgabedatei.
   */

  outputArgs.push(
    '-map',
    `0:${videoIndex}`
  );


  // ============================================================
  // VIDEO ENCODING / COPY
  // ============================================================

  if (
    videoNeedsEncoding
  ) {
    outputArgs.push(
      '-c:v',
      'h264_qsv'
    );


    outputArgs.push(
      '-global_quality',
      String(qsvQuality)
    );


    outputArgs.push(
      '-preset',
      qsvPreset
    );


    // ========================================================
    // HDR -> SDR
    // ========================================================

    if (
      needsHDRConversion
    ) {
      /*
       * HDR -> SDR:
       *
       * 10-bit HDR
       *      ↓
       * zscale linear
       *      ↓
       * tonemap
       *      ↓
       * BT.709
       *      ↓
       * NV12 / 8-bit
       *
       * hable liefert einen guten
       * allgemeinen Film-Look.
       */

      outputArgs.push(
        '-vf',
        'zscale=t=linear:npl=100,tonemap=tonemap=hable:desat=0,zscale=primaries=bt709:transfer=bt709:matrix=bt709,format=nv12'
      );
    } else {
      /*
       * SDR bzw. normales
       * Codec-Transcoding.
       */

      outputArgs.push(
        '-vf',
        'format=nv12'
      );
    }
  } else {
    /*
     * Bereits vorhandenes H.264 SDR:
     * Video wird NICHT neu encodiert.
     */

    outputArgs.push(
      '-c:v',
      'copy'
    );
  }


  // ============================================================
  // AUDIO
  // ============================================================

  const audioLog = [];


  germanAudioStreams.forEach(
    (audioStream, idx) => {
      const audioIndex =
        audioStream.index;


      const originalChannels =
        Number(
          audioStream.channels || 2
        );


      const outputChannels =
        Math.min(
          originalChannels,
          maxAudioChannels
        );


      outputArgs.push(
        '-map',
        `0:${audioIndex}`
      );


      outputArgs.push(
        `-c:a:${idx}`,
        'aac'
      );


      outputArgs.push(
        `-b:a:${idx}`,
        aacBitrate
      );


      outputArgs.push(
        `-ac:${idx}`,
        String(
          outputChannels
        )
      );


      const language =
        (
          audioStream.tags &&
          (
            audioStream.tags.language ||
            audioStream.tags.LANGUAGE
          )
        ) || 'unknown';


      audioLog.push(
        `Audio ${audioIndex}: ${language}, ` +
        `${originalChannels} -> ` +
        `${outputChannels} Kanäle`
      );
    }
  );


  // ============================================================
  // UNTERTITEL
  // ============================================================

  const subtitleLog = [];


  selectedSubtitleStreams.forEach(
    (subtitleStream, idx) => {
      const subtitleIndex =
        subtitleStream.index;


      outputArgs.push(
        '-map',
        `0:${subtitleIndex}`
      );


      outputArgs.push(
        `-c:s:${idx}`,
        'copy'
      );


      const language =
        (
          subtitleStream.tags &&
          (
            subtitleStream.tags.language ||
            subtitleStream.tags.LANGUAGE
          )
        ) || 'unknown';


      const forced =
        subtitleStream.disposition &&
        (
          subtitleStream.disposition.forced === 1 ||
          subtitleStream.disposition.forced === true
        );


      subtitleLog.push(
        `Subtitle ${subtitleIndex}: ` +
        `${language}, forced=${forced}`
      );
    }
  );


  // ============================================================
  // DATA
  // ============================================================

  if (
    removeData
  ) {
    outputArgs.push(
      '-dn'
    );
  }


  // ============================================================
  // METADATA
  // ============================================================

  if (
    copyMetadata
  ) {
    outputArgs.push(
      '-map_metadata',
      '0'
    );
  }


  // ============================================================
  // KAPITEL
  // ============================================================

  outputArgs.push(
    '-map_chapters',
    copyChapters
      ? '0'
      : '-1'
  );


  // ============================================================
  // OUTPUT
  // ============================================================

  response.preset =
    `<io> ${outputArgs.join(' ')}`;


  response.container =
    '.mkv';


  response.processFile =
    true;


  // ============================================================
  // LOG
  // ============================================================

  let hdrDescription =
    'No HDR';


  if (isHDR10) {
    hdrDescription =
      'HDR10';
  } else if (isHLG) {
    hdrDescription =
      'HLG';
  } else if (isHDR) {
    hdrDescription =
      'HDR';
  }


  let hdrAction =
    'None';


  if (
    needsHDRConversion
  ) {
    hdrAction =
      'HDR -> SDR Tonemap';
  } else if (
    isHDR
  ) {
    hdrAction =
      'HDR preserved';
  }


  response.infoLog =
    '========== CUSTOM H264 QSV 1.7.0 ==========\n' +

    `Target codecs: ${targetVideoCodecs.join(', ')}\n` +

    `HDR Mode: ${hdrMode}\n` +

    `Video stream: ${videoIndex}\n` +

    `Video codec: ${videoCodec}\n` +

    `Video mode: ${videoMode}\n` +

    `Video profile: ${videoProfile || 'unknown'}\n` +

    `Pixel format: ${pixelFormat || 'unknown'}\n` +

    `Bit depth: ${bitDepth || 'unknown'}\n` +

    `Resolution: ${width}x${height}\n` +

    `Color transfer: ${colorTransfer || 'unknown'}\n` +

    `Color primaries: ${colorPrimaries || 'unknown'}\n` +

    `Color space: ${colorSpace || 'unknown'}\n` +

    `HDR detected: ${isHDR}\n` +

    `HDR type: ${hdrDescription}\n` +

    `HDR action: ${hdrAction}\n` +

    'Hardware decoder: NONE (CPU decode)\n' +

    'Hardware encoder: h264_qsv\n' +

    `QSV Quality: ${qsvQuality}\n` +

    `QSV Preset: ${qsvPreset}\n` +

    `AAC bitrate: ${aacBitrate}\n` +

    `Max Audio Channels: ${maxAudioChannels}\n` +

    '\n' +

    'Audio streams:\n' +

    audioLog
      .map((x) => `  ${x}`)
      .join('\n') +

    '\n\n' +

    `Subtitle Mode: ${subtitleMode}\n` +

    'Subtitle streams:\n' +

    (
      subtitleLog.length > 0
        ? subtitleLog
            .map((x) => `  ${x}`)
            .join('\n')
        : '  None'
    ) +

    '\n\n' +

    `Selected subtitles: ${selectedSubtitleStreams.length}\n` +

    `Data streams removed: ${removeData}\n` +

    `Metadata copied: ${copyMetadata}\n` +

    `Chapters copied: ${copyChapters}\n` +

    '==========================================\n' +

    'FFmpeg Output Flags:\n' +

    outputArgs.join(' ');


  return response;
};
