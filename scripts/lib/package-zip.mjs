import {safePath,uniquePaths} from './package-files.mjs';

// A deliberately narrow classic ZIP STORE profile; no third-party archiver or extraction.
// File format reference: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
const limit=512*1024*1024;
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
export function createZip(files,rootFolder){
  safePath(rootFolder);if(rootFolder.includes('/'))throw Error('ZIP needs one root folder');
  uniquePaths(files.keys());if(!files.size||files.size>=65535)throw Error('Classic ZIP entry-count limit');
  const locals=[],central=[];let offset=0;
  for(const[path,bytes]of[...files].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const name=Buffer.from(`${rootFolder}/${path}`),crc=crc32(bytes);
    if(name.length>65535||bytes.length>limit)throw Error('ZIP file/profile size limit');
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);
    local.writeUInt16LE(0x21,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(bytes.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
    const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(0x314,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x800,8);record.writeUInt16LE(0x21,14);
    record.writeUInt32LE(crc,16);record.writeUInt32LE(bytes.length,20);record.writeUInt32LE(bytes.length,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE((0o100644*65536)>>>0,38);record.writeUInt32LE(offset,42);
    locals.push(local,name,bytes);central.push(record,name);offset+=local.length+name.length+bytes.length;if(offset>limit)throw Error('ZIP archive exceeds512MiB profile');
  }
  const centralBytes=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.size,8);end.writeUInt16LE(files.size,10);end.writeUInt32LE(centralBytes.length,12);end.writeUInt32LE(offset,16);
  if(offset+centralBytes.length+22>limit)throw Error('ZIP archive exceeds512MiB profile');
  return Buffer.concat([...locals,centralBytes,end]);
}
export function readZip(bytes){
  if(bytes.length<22||bytes.length>limit)throw Error('ZIP size outside supported profile');
  const end=bytes.length-22;
  if(bytes.readUInt32LE(end)!==0x06054b50||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6)||bytes.readUInt16LE(end+20))throw Error('Unsupported ZIP footer/disk/comment');
  const count=bytes.readUInt16LE(end+10),centralSize=bytes.readUInt32LE(end+12),start=bytes.readUInt32LE(end+16);
  if(!count||count===65535||bytes.readUInt16LE(end+8)!==count||start+centralSize!==end)throw Error('Invalid ZIP central directory');
  let cursor=start,nextLocal=0,rootFolder;const files=new Map(),seen=[];
  for(let i=0;i<count;i++){
    if(cursor+46>end||bytes.readUInt32LE(cursor)!==0x02014b50)throw Error('Bad ZIP central record');
    const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),crc=bytes.readUInt32LE(cursor+16),compressed=bytes.readUInt32LE(cursor+20),size=bytes.readUInt32LE(cursor+24),length=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),attrs=bytes.readUInt32LE(cursor+38),offset=bytes.readUInt32LE(cursor+42);
    if(bytes.readUInt16LE(cursor+4)!==0x314||bytes.readUInt16LE(cursor+6)!==20||flags!==0x800||method!==0||compressed!==size||extra||comment||bytes.readUInt16LE(cursor+34)||bytes.readUInt16LE(cursor+36)||offset!==nextLocal||attrs!==((0o100644*65536)>>>0)||bytes.readUInt16LE(cursor+12)!==0||bytes.readUInt16LE(cursor+14)!==0x21)throw Error('ZIP outside canonical STORE profile');
    if(cursor+46+length>end)throw Error('Truncated ZIP name');
    const encoded=bytes.subarray(cursor+46,cursor+46+length),name=encoded.toString('utf8');if(!Buffer.from(name).equals(encoded))throw Error('Invalid UTF-8 ZIP path');safePath(name);seen.push(name);
    const slash=name.indexOf('/');if(slash<1)throw Error('Missing ZIP root');const root=name.slice(0,slash),path=name.slice(slash+1);safePath(path);if(rootFolder&&root!==rootFolder)throw Error('Multiple ZIP roots');rootFolder=root;
    if(offset+30>start||bytes.readUInt32LE(offset)!==0x04034b50)throw Error('Invalid ZIP local offset');
    const localLength=bytes.readUInt16LE(offset+26),localExtra=bytes.readUInt16LE(offset+28),dataStart=offset+30+localLength+localExtra,dataEnd=dataStart+size;
    if(localExtra||localLength!==length||dataEnd>start||!bytes.subarray(offset+30,offset+30+length).equals(encoded)||bytes.readUInt16LE(offset+4)!==20||bytes.readUInt16LE(offset+6)!==flags||bytes.readUInt16LE(offset+8)!==method||bytes.readUInt16LE(offset+10)!==0||bytes.readUInt16LE(offset+12)!==0x21||bytes.readUInt32LE(offset+14)!==crc||bytes.readUInt32LE(offset+18)!==size||bytes.readUInt32LE(offset+22)!==size)throw Error('ZIP local/central mismatch');
    const payload=bytes.subarray(dataStart,dataEnd);if(crc32(payload)!==crc)throw Error('ZIP CRC mismatch');files.set(path,payload);nextLocal=dataEnd;cursor+=46+length;
  }
  uniquePaths(seen);if(nextLocal!==start||cursor!==end||files.size!==count)throw Error('ZIP has extra/missing data');
  return {files,rootFolder};
}
