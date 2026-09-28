import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { toPng } from 'html-to-image'
import { Camera, Check, ChevronDown, Download, ExternalLink, LockKeyhole, QrCode, ScanLine, Sparkles, X } from 'lucide-react'
import projects from './data/projects.json'
import './App.css'

const tileColors = ['#d9f4df', '#ffe4a3', '#ffd7d4', '#dfe5ff', '#ffe1b8', '#e3f6f5', '#f6e3f8', '#fbe3c7']

const personalities = [
  { key: 'mechanical', name: 'Broccoli', emoji: '🥦', title: 'The Sturdy Tinkerer', color: '#8aca75', description: 'You see the world as a pile of charmingly disobedient parts waiting to click together.', strengths: ['Makes excellent prototypes', 'Stays calm under squeaky pressure', 'Can fix a wobbly table with one paperclip'], weakness: 'Occasionally over-engineers a snack.', flavor: 'earthy, inventive, and lightly crunchy' },
  { key: 'chemical', name: 'Blueberry', emoji: '🫐', title: 'The Tiny Alchemist', color: '#9da9ec', description: 'Your curiosity bubbles, fizzes, and occasionally turns a perfectly good liquid a surprising color.', strengths: ['Asks the interesting question', 'Finds magic in materials', 'Very good at controlled chaos'], weakness: 'Cannot resist mixing two mysterious liquids.', flavor: 'bright, clever, and a little bit fizzy' },
  { key: 'curious', name: 'Carrot', emoji: '🥕', title: 'The Keen Explorer', color: '#f3a368', description: 'You are powered by questions, snacks, and the deep conviction that there is always another button.', strengths: ['Sees possibilities everywhere', 'Makes friends with hard problems', 'Fearless about trying again'], weakness: 'Has never met a rabbit hole they did not like.', flavor: 'sunny, bold, and pleasantly rooty' },
  { key: 'balanced', name: 'Avocado', emoji: '🥑', title: 'The Smooth Collaborator', color: '#a97a4c', description: 'You bring just the right amount of soft edges and strong opinions to every build.', strengths: ['Balances big ideas with details', 'Makes teamwork feel easy', 'Knows when to add a little lime'], weakness: 'Needs a moment to ripen before deadlines.', flavor: 'calm, creamy, and secretly ambitious' },
  { key: 'wild', name: 'Pineapple', emoji: '🍍', title: 'The Spiky Original', color: '#f5cf56', description: 'You bring unusual angles, bright energy, and a crown you absolutely did not ask permission to wear.', strengths: ['Brings memorable ideas', 'Thrives on happy accidents', 'Makes every demo more fun'], weakness: 'Can be a bit prickly before lunch.', flavor: 'tropical, brave, and delightfully extra' },
]

const UNLOCK_TARGET = 5
const RESCAN_COOLDOWN_MS = 4000
const HINT_DURATION_MS = 1000

function App() {
  const [scanned, setScanned] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [devPersonalityKey, setDevPersonalityKey] = useState(null)
  const reportCardRef = useRef(null)
  const reportSectionRef = useRef(null)
  const reportFrontRef = useRef(null)
  const [reportScale, setReportScale] = useState(1)
  const [revealTaps, setRevealTaps] = useState(0)
  const [reportRevealed, setReportRevealed] = useState(false)
  const [scanNote, setScanNote] = useState('Point your camera at a project QR')
  const [justUnlocked, setJustUnlocked] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [hintedId, setHintedId] = useState(null)
  const hintTimeoutRef = useRef(null)
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ text: '', time: 0 })
  const [introStep, setIntroStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setIntroStep(1), 300),
      setTimeout(() => setIntroStep(2), 1300),
      setTimeout(() => setIntroStep(3), 1900),
      setTimeout(() => setIntroStep(4), 2400),
      setTimeout(() => setIntroStep(5), 3200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const addProject = useCallback((project) => {
    setScanned((current) => {
      if (current.some((item) => item.id === project.id)) {
        setScanNote('You already found this one. Try another poster!')
        return current
      }
      setRevealTaps(0)
      setReportRevealed(false)
      setScanNote(`Nice find! ${project.name} joined your collection.`)
      const updated = [...current, project]
      if (updated.length === UNLOCK_TARGET) setJustUnlocked(true)
      return updated
    })
    setSelectedProject(project)
  }, [])

  const closeProjectModal = () => {
    setSelectedProject(null)
    if (justUnlocked) {
      setJustUnlocked(false)
      setShowUnlockModal(true)
    }
  }

  const scrollToReport = () => {
    setShowUnlockModal(false)
    reportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDecode = useCallback((result) => {
    const text = (typeof result === 'string' ? result : result?.data || '').trim()
    if (!text) return
    const now = Date.now()
    if (text === lastScanRef.current.text && now - lastScanRef.current.time < RESCAN_COOLDOWN_MS) return
    lastScanRef.current = { text, time: now }
    const match = projects.find((project) => project.url && project.url === text)
    if (match) addProject(match)
    else setScanNote("That code isn't linked to a gallery project yet.")
  }, [addProject])

  const startCamera = async () => {
    if (!videoRef.current) return
    try {
      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(videoRef.current, handleDecode, {
          onDecodeError: () => {},
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        })
      }
      await scannerRef.current.start()
      setCameraOn(true)
      setScanNote('Camera ready. Point it at a project QR code.')
    } catch {
      setCameraOn(false)
      setScanNote('Camera permission was not granted. Try the demo scan below.')
    }
  }

  const stopCamera = () => {
    scannerRef.current?.stop()
    setCameraOn(false)
    setScanNote('Camera paused. Open it again whenever you are ready.')
  }

  const triggerHint = (id) => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current)
    setHintedId(id)
    hintTimeoutRef.current = setTimeout(() => setHintedId(null), HINT_DURATION_MS)
  }

  const downloadReport = async () => {
    if (!reportFrontRef.current) return
    try {
      setScanNote('Rendering your card…')
      const dataUrl = await toPng(reportFrontRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `idp-gallery-${personality.name.toLowerCase()}-card.png`
      link.click()
      setScanNote('Card saved! Share it on your story.')
    } catch {
      setScanNote('Could not save the card image. Try again in a moment.')
    }
  }

  useEffect(() => () => scannerRef.current?.destroy(), [])

  useEffect(() => () => { if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current) }, [])

  useEffect(() => {
    if (!scannerRef.current) return
    if (selectedProject) scannerRef.current.pause()
    else if (cameraOn) scannerRef.current.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject])

  useEffect(() => {
    if (!reportCardRef.current) return undefined
    const updateScale = () => setReportScale(Math.min(reportCardRef.current.clientWidth / 794, 1))
    const observer = new ResizeObserver(updateScale)
    observer.observe(reportCardRef.current)
    updateScale()
    return () => observer.disconnect()
  }, [scanned.length])

  const tapReportCard = () => {
    if (reportRevealed) return
    const nextTap = revealTaps + 1
    setRevealTaps(nextTap)
    if (nextTap >= 3) setReportRevealed(true)
  }

  const scores = scanned.reduce((totals, project) => Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value + (project.scores[key] || 0)])), { mechanical: 0, chemical: 0, curious: 0 })
  const unlocked = scanned.length >= UNLOCK_TARGET
  const topTrait = unlocked ? Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] : 'balanced'
  const calculatedPersonality = personalities.find((item) => item.key === topTrait) || personalities[3]
  const personality = personalities.find((item) => item.key === devPersonalityKey) || calculatedPersonality
  const progress = Math.min(scanned.length * (100 / UNLOCK_TARGET), 100)
  const dominantTrait = selectedProject ? Object.entries(selectedProject.scores).sort(([, a], [, b]) => b - a)[0][0] : null

  return (
    <main className="app-shell">
      <div className="shooting-stars" aria-hidden="true">
        <span style={{ top: '6%', left: '-12%', animationDelay: '0s' }} />
        <span style={{ top: '16%', left: '-12%', animationDelay: '2.6s' }} />
        <span style={{ top: '32%', left: '-12%', animationDelay: '5.1s' }} />
        <span style={{ top: '48%', left: '-12%', animationDelay: '7.8s' }} />
      </div>
      <nav className={`topbar app-reveal ${introStep >= 5 ? 'is-in' : ''}`}>
        <div className="nav-status"><span className="status-dot" /> field guide <span className="nav-divider" /> 2024–25</div>
      </nav>

      <section className="intro-grid intro-focus">
        <div className={`intro-heading intro-reveal ${introStep >= 1 ? 'is-in' : ''}`}><h1>Wander through <em>the work.</em></h1></div>
        <div className="intro-flow">
          <div className={`intro-aside intro-reveal ${introStep >= 2 ? 'is-in' : ''}`}><span className="qr-doodle"><QrCode size={32} strokeWidth={1.8} /></span><span>5 scans</span></div>
          <span className={`intro-arrow intro-reveal ${introStep >= 3 ? 'is-in' : ''}`} aria-hidden="true">→</span>
          <div className={`intro-aside intro-reveal ${introStep >= 4 ? 'is-in' : ''}`}><Sparkles size={26} /><span>1 silly report</span></div>
        </div>
      </section>

      <section className={`scanner-panel app-reveal ${introStep >= 5 ? 'is-in' : ''}`}>
        <div className={`camera-window ${cameraOn ? 'camera-active' : ''}`}>
          <video ref={videoRef} muted playsInline className="camera-feed" />
          <div className="scan-corner top-left" /><div className="scan-corner top-right" /><div className="scan-corner bottom-left" /><div className="scan-corner bottom-right" />
          {!cameraOn && <div className="camera-center"><span className="camera-icon"><ScanLine size={28} /></span><strong>Ready when you are</strong><small>{scanNote}</small></div>}
          <span className="live-pill"><span className="status-dot" /> {cameraOn ? 'LIVE' : 'IDP SCANNER'}</span>
          <span className="camera-count">{String(Math.min(scanned.length, UNLOCK_TARGET)).padStart(2, '0')} / 0{UNLOCK_TARGET}</span>
        </div>
        {cameraOn && <p className="camera-caption">{scanNote}</p>}
        <div className="scan-actions">
          <button className="primary-button" onClick={cameraOn ? stopCamera : startCamera}><Camera size={18} /> {cameraOn ? 'Stop camera' : 'Open camera'}</button>
        </div>
        {devMode && <div className="dev-panel"><div><span className="eyebrow">DEV MODE</span><strong>Choose a project to simulate a scan</strong></div><div className="dev-projects">{projects.map((project) => <button key={project.id} type="button" className={scanned.some((item) => item.id === project.id) ? 'selected' : ''} onClick={() => addProject(project)}>{project.name}<Check size={14} /></button>)}</div><div className="dev-report-picker"><span className="eyebrow">PREVIEW A REPORT</span><div>{personalities.map((item) => <button key={item.key} type="button" className={personality.key === item.key ? 'selected' : ''} onClick={() => setDevPersonalityKey(item.key)}><span>{item.emoji}</span>{item.name}</button>)}<button type="button" className={!devPersonalityKey ? 'selected' : ''} onClick={() => setDevPersonalityKey(null)}>auto result</button></div></div></div>}
      </section>

      <section className={`collection-section app-reveal ${introStep >= 5 ? 'is-in' : ''}`}>
        <div className="section-heading"><div><h2>Your field notes</h2></div><span className="count-label">{scanned.length} of {projects.length} discovered</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="project-grid">
          {projects.map((project, index) => {
            const found = scanned.some((item) => item.id === project.id)
            const hinting = hintedId === project.id
            return <button type="button" key={project.id} className={`project-tile ${found ? 'found' : ''} ${hinting ? 'hinting' : ''}`} style={{ '--tile-color': tileColors[index % tileColors.length] }} onClick={() => (found ? setSelectedProject(project) : triggerHint(project.id))}>
              {found ? <><img src={project.image} alt="" /><span className="tile-check"><Check size={15} /></span><span className="tile-name">{project.name}</span></> : <><img src={project.image} alt="" className="tile-hint-image" /><span className="tile-hint-content"><LockKeyhole size={18} /><span className="tile-lock">Hint</span></span></>}
            </button>
          })}
        </div>
      </section>

      <section className={`report-section app-reveal ${introStep >= 5 ? 'is-in' : ''} ${unlocked ? 'unlocked' : ''}`} ref={reportSectionRef}>
        <div className="report-header"><div><h2>{unlocked ? 'The results are in.' : 'Your report is growing.'}</h2></div>{!unlocked && <span className="locked-label"><LockKeyhole size={15} /> {UNLOCK_TARGET - scanned.length} more to unlock</span>}</div>
        {unlocked ? <><div className={`report-card ${reportRevealed ? 'is-revealed' : ''}`} ref={reportCardRef} style={{ '--report-color': personality.color }} onClick={tapReportCard} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && tapReportCard()} aria-label={reportRevealed ? `${personality.name} personality report` : `Tap ${3 - revealTaps} more times to reveal your personality`}><div className="report-card-flip" style={{ transform: `scale(${reportScale}) rotateY(${reportRevealed ? 0 : 180}deg)` }}><div className="report-card-face report-card-inner report-card-front" ref={reportFrontRef}><div className="report-brand"><img src="/logos/nus.svg" alt="NUS" className="report-brand-logo" /><img src="/logos/idp.png" alt="IDP" className="report-brand-logo report-brand-logo-idp" /></div><div className="report-illustration">{personality.emoji}</div><div className="report-copy"><span className="report-kicker">You are a</span><h3>{personality.name}</h3><p className="report-title">{personality.title}</p><p>{personality.description}</p><div className="report-facts"><div><span>good at</span><strong>{personality.strengths[0]}</strong></div><div><span>watch out for</span><strong>{personality.weakness}</strong></div><div><span>overall flavor</span><strong>{personality.flavor}</strong></div></div></div><div className="report-projects"><span>your evidence</span><div className="report-projects-row">{scanned.map((project) => <img key={project.id} src={project.image} alt={project.name} title={project.name} />)}</div></div></div><div className="report-card-face report-card-back"><div className="spark-field" aria-hidden="true">{Array.from({ length: 12 }, (_, sparkIndex) => <span key={sparkIndex} style={{ '--spark-index': sparkIndex }}>✦</span>)}</div><span className="back-sparkle">✦</span><p className="back-kicker">gallery secret</p><h3>Tap 3 times<br />to reveal your personality</h3><p className="tap-progress">{revealTaps} / 3 taps</p><div className="tap-dots">{[0, 1, 2].map((tapIndex) => <span key={tapIndex} className={tapIndex < revealTaps ? 'complete' : ''} />)}</div></div></div></div><button className="download-button" onClick={(event) => { event.stopPropagation(); downloadReport() }}><Download size={17} /> Save your card</button>{reportRevealed && <div className="alternate-cards"><span className="eyebrow">other garden cards</span><div>{personalities.filter((item) => item.key !== personality.key).map((item) => <article key={item.key} className="alternate-card" style={{ '--alternate-color': item.color }}><span>{item.emoji}</span><strong>{item.name}</strong><small>{item.title}</small></article>)}</div></div>}</> : <div className="report-locked"><span className="sprout">✦</span><p>The gallery is still whispering.<br /><strong>Find {UNLOCK_TARGET} projects</strong> to hear the whole story.</p><div className="locked-meter"><span style={{ width: `${progress}%` }} /></div></div>}
      </section>

      <footer className={`app-reveal ${introStep >= 5 ? 'is-in' : ''}`}><span>ENGINEERING DESIGN &amp; PRODUCT / GALLERY FIELD GUIDE</span><button className={`dev-toggle ${devMode ? 'active' : ''}`} onClick={() => setDevMode((current) => !current)}><span /> dev mode</button><span>made for curious humans <span className="heart">♥</span></span></footer>

      {selectedProject && <div className="modal-backdrop" onClick={closeProjectModal}><div className="project-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={closeProjectModal} aria-label="Close project"><X size={20} /></button><div className="modal-scroll"><img src={selectedProject.image} alt="" /><div className="modal-body"><span className="eyebrow">{selectedProject.category}</span><h2>{selectedProject.name}</h2><p className="modal-tag">{selectedProject.tag}</p><p className="modal-description">{selectedProject.description}</p><p className="modal-team">{selectedProject.team}</p><div className="modal-note"><Sparkles size={16} /> This project adds a little {dominantTrait} sparkle to your report.</div></div></div><div className="modal-actions"><button className="primary-button" onClick={closeProjectModal}>Keep exploring <ChevronDown size={16} /></button>{selectedProject.url && <a className="secondary-button" href={selectedProject.url} target="_blank" rel="noopener noreferrer">Visit original page <ExternalLink size={15} /></a>}</div></div></div>}

      {showUnlockModal && <div className="unlock-backdrop" onClick={() => setShowUnlockModal(false)}><div className="unlock-modal" onClick={(event) => event.stopPropagation()}><button className="unlock-close" onClick={() => setShowUnlockModal(false)} aria-label="Close"><X size={16} /></button><div className="spark-field" aria-hidden="true">{Array.from({ length: 12 }, (_, sparkIndex) => <span key={sparkIndex} style={{ '--spark-index': sparkIndex }}>✦</span>)}</div><Sparkles size={40} className="unlock-icon" /><span className="unlock-kicker">gallery secret unlocked</span><h2>Your report has bloomed.</h2><p>You've found {UNLOCK_TARGET} projects. Scroll down to reveal your full botanical report.</p><button className="primary-button" onClick={scrollToReport}>See my report <ChevronDown size={16} /></button></div></div>}
    </main>
  )
}

export default App
