/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import path from 'path';
import { __dirname, FACEBOOK_APP_ID, FACEBOOK_CLIENT_SECRET, REDIRECT_URI ,require} from './Env.js'
import express from 'express'
import fetch from 'node-fetch';
import formidable from 'formidable';
import { log } from 'console';
import fs from 'fs'
import initializeVideoUplaod from './controlars/fb/initializeVideoUplaod.js';
import { makeUrlWithParams } from 'string-player';



const app = express();
let access_token=require('./fb.json').access_token;

app.use(express.static(path.resolve(__dirname, './public')))


app.get('/', (req, res) => res.redirect('/Auth.html'));


app.get("/facebook/login", (req, res) => {
    let params = new URLSearchParams()
    let url=makeUrlWithParams(`https://www.facebook.com/v21.0/dialog/oauth`,{
        client_id: FACEBOOK_APP_ID,
        redirect_uri: REDIRECT_URI,
        state: 'csrf_token',
        scope: [
            'publish_video',
            'pages_read_engagement',
            'pages_manage_metadata',
            'pages_manage_posts',
            'pages_show_list'
        ].join(',')
    });
    res.redirect(url);
});

app.get('/facebook/callback', async function (req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code missing");
    let params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: FACEBOOK_CLIENT_SECRET,
        code,
    });
    let response = await fetch('https://graph.facebook.com/v21.0/oauth/access_token?' + params.toString(), {});
    response = await response.json();
    console.log(response);
    if (response.access_token) {
        fs.writeFileSync(path.resolve(__dirname, './fb.json'), JSON.stringify({
            ...response
        }))
    }
    return res.redirect('/account.html')
})


app.post('/video', async function (req, res) {
    try {
        log('video upload started')
        let id=await initializeVideoUplaod(access_token);
        let response=await fetch(`https://graph.facebook.com/v21.0/${id}`, {
            method :"POST",
            headers :{
                Authorization :`OAuth ${access_token}`,
                file_offset :0,
                'Catch-Control':'no-catch',
                'User-Agent':req.headers['user-agent'],
                // "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
            },
            body :fs.readFileSync(path.resolve(__dirname,'./video/video.mp4'))
        });

        response=await response.json();

        console.log(response);
        if (response.h) {
            let PAGE_ID=190035777531639;
            let fbuploader_video_file_chunk=response.h;
            let form =new FormData();
            form.append('access_token',access_token);
            form.append('title','By the marcy of Allah , This video will be publish Insha Allah');
            form.append('description','By the marcy of Allah , This video will be publish Insha Allah');
            form.append('fbuploader_video_file_chunk',fbuploader_video_file_chunk);
            response=await fetch(`https://graph-video.facebook.com/v21.0/${PAGE_ID}/videos`, {
                headers:{
                    Authorization :`OAuth ${access_token}`,
                    'User-Agent':req.headers['user-agent'],
                    "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
                },
                method:'POST',
                body:form
            });
            response=await response.json();
            console.log(response)
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500)
    }
})



app.listen(3000)