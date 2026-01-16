import React from 'react'
import api from '../services/api'


export default function MediaUploader({ onUploaded }) {
    async function onFile(e) {
        const f = e.target.files[0]
        if (!f) return
        const fd = new FormData(); fd.append('file', f)
        const res = await api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        onUploaded && onUploaded(res.data)
    }
    return (
        <div>
            <input type="file" accept="image/*,video/*" onChange={onFile} />
        </div>
    )
}