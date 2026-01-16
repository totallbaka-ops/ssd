import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react'

export default function ChatWidget({ onPartial }) {
    const [msgs, setMsgs] = useState([])
    const [val, setVal] = useState('')
    const [loading, setLoading] = useState(false)
    const [completed, setCompleted] = useState(false)
    const bottomRef = useRef(null)

    // Initialize chat
    useEffect(() => {
        if (msgs.length === 0) {
            setMsgs([{ from: 'bot', text: "Hi! I'm your Civic Assistant. Please describe the issue you're facing, including location and details." }])
        }
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [msgs, loading])

    async function send() {
        if (!val.trim()) return

        const userText = val.trim()
        setVal('')

        // Add user message
        const newMsgs = [...msgs, { from: 'user', text: userText }]
        setMsgs(newMsgs)
        setLoading(true)

        try {
            // Send history + new message to backend
            const history = newMsgs.map(m => ({ from: m.from, text: m.text }))

            const res = await api.post('/ai/chat', {
                history: history.slice(0, -1), // Send history excluding current message (handled by backend prompt logic usually, but here we send context)
                currentInput: userText
            })

            const { nextMessage, gatheredInfo, completed, offTopic } = res.data

            if (offTopic) {
                setMsgs(prev => [...prev, { from: 'bot', text: nextMessage || "I can only help with civic complaints. Please tell me about an issue." }])
            } else {
                setMsgs(prev => [...prev, { from: 'bot', text: nextMessage }])

                // Update parent form if we have info
                if (onPartial && gatheredInfo) {
                    onPartial({
                        description: gatheredInfo.problem, // Map problem to description for now
                        issueType: null, // Let backend summarizer handle this later or infer
                        locationText: gatheredInfo.location,
                        // We can pass other fields if the parent component supports them
                        ...gatheredInfo
                    })
                }

                if (completed) {
                    finishConversation(gatheredInfo)
                }
            }

        } catch (err) {
            console.error(err)
            setMsgs(prev => [...prev, { from: 'bot', text: "I'm having trouble connecting. Please try again.", icon: AlertTriangle }])
        } finally {
            setLoading(false)
        }
    }

    async function finishConversation(finalAnswers) {
        setLoading(true)
        setCompleted(true)

        // Trigger final summarization
        try {
            // Construct a transcript or just use the gathered info
            const transcript = `
                Problem: ${finalAnswers.problem}
                Location: ${finalAnswers.location}
                Duration: ${finalAnswers.duration}
                Severity: ${finalAnswers.severity}
                Safety: ${finalAnswers.safety}
                Affected: ${finalAnswers.affected}
                Additional: ${finalAnswers.additional}
            `

            const res = await api.post('/ai/summarize', { text: transcript })
            const { botReply, issueType, formattedDescription, summary } = res.data

            setMsgs(prev => [...prev, { from: 'bot', text: botReply || "Report generated successfully. You can now submit it." }])

            if (onPartial) {
                onPartial({
                    description: formattedDescription,
                    issueType: issueType,
                    summary: summary,
                    locationText: finalAnswers.location
                })
            }
        } catch (err) {
            console.error("Summarization error:", err)
            setMsgs(prev => [...prev, { from: 'bot', text: "I've gathered your details, but couldn't generate the final summary. You can still submit." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[500px] font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 flex items-center gap-3 shadow-md">
                <div className="bg-white/10 p-2 rounded-full">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">Civic Assistant</h3>
                    <p className="text-blue-100 text-xs">AI-Powered Support</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
                {msgs.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.from === 'bot' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {m.from === 'bot' ? <Bot size={16} /> : <User size={16} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] p-3.5 text-sm leading-relaxed shadow-sm ${m.from === 'bot'
                            ? 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100'
                            : 'bg-blue-600 text-white rounded-2xl rounded-tr-none'
                            }`}>
                            {m.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot size={16} className="text-blue-700" />
                        </div>
                        <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            {!completed ? (
                <div className="p-3 bg-white border-t border-gray-100">
                    <div className="flex gap-2 items-center">
                        <input
                            value={val}
                            onChange={e => setVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            className="flex-1 bg-blue-50 border border-blue-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-full px-4 text-sm text-blue-900 placeholder-blue-300 h-[28px] outline-none transition-all"
                            placeholder="Type your answer..."
                            autoFocus
                        />
                        <button
                            onClick={send}
                            disabled={!val.trim() || loading}
                            className="w-[28px] h-[28px] flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm transform active:scale-95"
                        >
                            <Send size={13} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-green-50 border-t border-green-100 text-center">
                    <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Report Ready
                    </p>
                </div>
            )}
        </div>
    )
}