/*
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ  ﷺ  
InshaAllah, By his marcy I will Gain Success 
*/

import Awaiter from "awaiter.js";
import VideoUploader from "./videoUpload.js";
import { log } from "string-player";
import {__dirname,require , FACEBOOK_APP_ID ,FACEBOOK_GRAPH_API,FACEBOOK_GRAPH_VERSION,FACEBOOK_CLIENT_SECRET,FACEBOOK_PAGE_ID,FB_USER_ID} from "../../Env.js";
import initializeVideoUplaod from "./initializeVideoUplaod";
import fs from 'fs'
import path from 'path';
import fetch, { FormData } from 'node-fetch';

//This are some apis what have been failed and return error
async function chatGptVideoUpload(req,res){
    let 
    access_token=require('./fb.json').page_access_token,
    video_path=path.resolve(__dirname, './video/video.mp4');
    try {
        let params=(new URLSearchParams({
            upload_phase: 'start',
            file_size:fs.statSync(video_path).size,
            access_token
        })).toString()
        let response = await fetch('https://graph.facebook.com/v21.0/'+`${FACEBOOK_PAGE_ID}/videos?${params}`,{method:'POST'});
        response=await response.json();
        log(response);
        if (response.error || !response.upload_session_id || !response.end_offset || !response.start_offset) throw (response.error ?response.error :response);
        let { upload_session_id, start_offset, end_offset}=response;
        console.log('Upload session initialized:', upload_session_id);
        let currentOffset = parseInt(start_offset, 10);
        log(currentOffset)
        const videoStream = fs.createReadStream(video_path, { highWaterMark: 2 * 1024 * 1024 }); // 2MB chunks
        for await (const chunk of videoStream) {
            console.log(`Uploading chunk: Offset ${currentOffset}`);
            const formData = new FormData();
            formData.append('upload_phase', 'transfer');
            formData.append('start_offset', currentOffset);
            formData.append('upload_session_id', upload_session_id);
            formData.append('video_file_chunk', chunk);
            let response=await fetch( `https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/videos?access_token=${access_token}`, {
                method:'POST',
                body:formData,
                headers:{
                    "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
                }
            })
            response=await response.json();
            console.log(response)
            if (response.error) throw response.error
            currentOffset = parseInt(response.start_offset, 10);
            if (currentOffset === parseInt(response.end_offset, 10)) break;
        }
        params = (new URLSearchParams({
            upload_phase: 'finish',
            upload_session_id,
            description: 'Test the video upload api',
            access_token,
        })).toString()
        response=await fetch(`https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/videos?${params}`,{method:'POST'});
        response=await response.json();
        log(response)
        return res.json(response)
    } catch (error) {
        console.error(error)
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
 }
async function videoUploadNoResumable(req, res) {
    try {
        let access_token=require('./fb.json').page_access_token;
        let form=new FormData(),file=fs.readFileSync(path.resolve(__dirname, './video/video.mp4'),'binary');
        form.append('file',file);
        form.append('description','testing video upload');
        form.append('access_token',access_token);
        let response=await fetch(`https://graph.facebook.com/v21.0/${FACEBOOK_PAGE_ID}/videos?access_token=${access_token}`, {
            headers :{
                "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
            },
            body:form,
            method:"POST"
        });
        response=await response.json();
        console.log(response);
        return res.json({
            ...response
        })
    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
  }
async function uploadVideoByResumablefileUpload(req, res) {
    try {
        let access_token=require('./fb.json').page_access_token;
        let id = await initializeVideoUplaod(access_token);
        let response = await fetch(`https://graph.facebook.com/v21.0/${id}`, {
            method: "POST",
            headers: {
                Authorization: `OAuth ${access_token}`,
                file_offset: 0,
                'Catch-Control': 'no-catch',
                'User-Agent': req.headers['user-agent'],
                // "Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarysh2fSEG8dzn7Ufiw"
            },
            body: fs.readFileSync(path.resolve(__dirname, './video/video.mp4'),'binary')
        });
        response = await response.json();
        if (response.error || !response.h) throw (response.error ? response.error :response);
        log('// video uploading started')
        let uploader = new VideoUploader({
            h: response.h,
            PAGE_ID: 190035777531639,
            title: 'By the marcy of Allah , This video will be publish Insha Allah',
            description: 'By the marcy of Allah , This video will be publish Insha Allah',
            user_agent: req.headers['user-agent'],
            access_token: access_token
        });
        let videoId,time=0;
        for (let i = 0; i < 30; i++) {
            videoId = await uploader.uploadVideo();
            if (videoId) i = 31;
            if (!videoId) {
                time+=10;
                log(`video upload waiting time is ${time} second`);
                await Awaiter(10000)
            }
        }
        if (!videoId) throw 'failed to upload video facebook'
        return res.status(201).json({
            success: true,
            massage: "Video Id of published video is " + videoId
        })

    } catch (error) {
        console.error(error);
        if (typeof error === 'string') {
            return res.json({
                hasError: true,
                error: {
                    massage: error
                }
            })
        }
        return res.json({
            hasError: true,
            error: error
        })
    }
}
