/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import fetch from "node-fetch";

function remover(string="a", data='') {
    for (let index = 5; index>4; index++) {
        if (data.includes(string)) data = data.replace(string, '');
        if (!data.includes(string)) index = 1;
    }
    return data
}

export default class VideoUploader {
    constructor(options) {
        this.h=options.h;
        this.PAGE_ID=options.PAGE_ID;
        this.access_token=options.access_token;
        this.title=options.title;
        this.description=options.description;
        this.user_agent=options.user_agent
        this.attemps=0;
    }

    uploadVideo=async function(params) {
        this.attemps=this.attemps+1;
        let form = new FormData();
        form.append('access_token', this.access_token);
        form.append('title', this.title);
        form.append('description', this.description);
        form.append('fbuploader_video_file_chunk', this.h);
        let response = await fetch(`https://graph-video.facebook.com/v21.0/${this.PAGE_ID}/videos`, {
            headers: {
                Authorization: `OAuth ${this.access_token}`,
                'User-Agent': this.user_agent,
                "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
            },
            method: 'POST',
            body: form
        });
        response = await response.json();
        if (this.attemps===10) console.log(response)
        if (response.id) return response.id
        if (response.error) return false
        return false
    }
}