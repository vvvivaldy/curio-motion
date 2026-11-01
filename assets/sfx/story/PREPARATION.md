# Reproducing prepared candidates

The imported WAV bytes are already prepared and independently reconstructed; do not rerun conversion merely to import or use them. SHA-256 values and all ten exact cut/gain/fade tuples are in cuts-manifest.json and the separate public story catalog.

prepare-candidates.py retains the original numerical algorithm, with portable repository-relative source paths and an existing ffmpeg selected through FFMPEG or PATH. It needs Python with NumPy. Running it writes a separate assets/sfx/story/prepared-candidates/ verification folder; it does not replace the runtime WAV files. A different decoder/version or changed cut requires scoped byte/DSP verification before replacing a candidate.

No listening is implied by the previous technical reconstruction or by copying files. Final cues, audible balance and the scene mix remain unapproved until reviewed in context. The source MP3 files are official HQ previews; their original WAV masters were not obtained.
