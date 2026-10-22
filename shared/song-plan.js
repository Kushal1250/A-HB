import {normaliseJourney} from './journey.js';
export const birthdaySongPlan = [
 {id:'invitation',song:'Iktara',from:'Wake Up Sid',mood:'A gentle, curious opening. A soft instrumental passage suits the invitation.'},
 {id:'gate',song:'Ilahi',from:'Yeh Jawaani Hai Deewani',mood:'A bright, uplifting welcome alongside the portrait.'},
 {id:'blessings',song:'Achyutam Keshavam',from:'Choose your preferred devotional recording',mood:'A peaceful devotional atmosphere for the blessing photographs.'},
 {id:'wishes',song:'Aashayein',from:'Iqbal',mood:'Hope, courage, and new beginnings.'},
 {id:'lantern',song:'Kun Faya Kun',from:'Rockstar',mood:'A calm, reflective mood as the lanterns light up.'},
 {id:'memories',song:'Yaaron',from:'KK',mood:'A warm friendship theme for real memories.'},
 {id:'celebration',song:'Baar Baar Din Ye Aaye',from:'Farz',mood:'The birthday celebration and candle moment.'},
 {id:'letter',song:'Tera Yaar Hoon Main',from:'Sonu Ke Titu Ki Sweety',mood:'A friendship theme. A quiet instrumental passage leaves room for reading.'},
 {id:'keepsake',song:'Love You Zindagi',from:'Dear Zindagi',mood:'A cheerful ending with hope for the year ahead.'},
];
export function assignUploadedSong(value,chapterId,media){
 if(media.kind!=='audio'||!media.mediaId)throw new Error('Choose an MP3 or WAV audio recording.');
 const j=normaliseJourney(value);
 if(!j.chapters.some(c=>c.id===chapterId))throw new Error('This chapter is no longer available.');
 return {...j,chapters:j.chapters.map(c=>c.id!==chapterId?c:{...c,trackId:media.mediaId,trackTitle:media.originalName||'',artist:'',source:media.originalName||'Local uploaded recording',license:'User-supplied recording; rights not independently verified.',provenance:'supplied',duration:0})};
}
