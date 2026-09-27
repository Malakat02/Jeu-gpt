const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let seed=18273645;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const box={Math:math};vm.runInNewContext(fs.readFileSync('content.js','utf8')+';globalThis.C=ForestContent;',box);
for(const level of [0,1]){
  let total=0;const signatures=new Set(),counts=new Set();
  for(let run=0;run<1000;run++){
    const rooms=box.C.makeRooms(level);const units=rooms.reduce((n,r)=>n+r.units,0);total+=units;counts.add(units);
    assert.ok(units>=(level?18:11)&&units<=(level?22:13));
    const occupied=[];for(const r of rooms)for(let y=0;y<r.spanY;y++)for(let x=0;x<r.spanX;x++)occupied.push((r.x+x)+','+(r.y+y));
    assert.equal(new Set(occupied).size,units,'no overlapping footprints');
    assert.equal(rooms.filter(r=>r.units===4).length,level?2:0);assert.equal(rooms.filter(r=>r.units===2).length,1);
    assert.equal(rooms.length,units-(level?7:1),'large rooms reduce distinct encounters');
    for(const type of ['start','shop','treasure','boss','secret','key','ante'])assert.equal(rooms.filter(r=>r.type===type).length,1,type);
    const boss=rooms.find(r=>r.type==='boss'),secret=rooms.find(r=>r.type==='secret');
    assert.equal(boss.links.length,1);assert.equal(secret.links.length,1);assert.equal(secret.entranceOpen,false);
    const neighbours=rooms.filter(r=>box.C.doorBetween(r,secret));
    assert.equal(neighbours.length,1,'secret cannot touch any second room or ordinary door');assert.equal(neighbours[0].id,secret.links[0]);assert.notEqual(neighbours[0],boss);
    const seen=new Set([0]),queue=[rooms[0]];
    while(queue.length){const room=queue.shift();for(const id of room.links){const next=rooms[id];assert.ok(next.links.includes(room.id));const door=box.C.doorBetween(room,next),back=box.C.doorBetween(next,room);assert.ok(door&&back);assert.equal(door.dx+back.dx,0);assert.equal(door.dy+back.dy,0);assert.ok(door.x>=64&&door.x<=room.width-64&&door.y>=80&&door.y<=room.height-80);if(next===boss||next===secret||seen.has(id))continue;seen.add(id);queue.push(next);}}
    assert.equal(seen.size,rooms.length-2,'key, shop and treasure accessible before boss without secret');
    signatures.add(JSON.stringify(rooms.map(r=>[r.x,r.y,r.type,r.links])));
  }
  assert.ok(Math.abs(total/1000-(level?20:12))<.2);assert.ok(signatures.size>990);assert.equal(counts.size,level?5:3);
  console.log(`PASS: floor ${level+1}, 1000 layouts, average ${total/1000} room units, ${signatures.size} different plans.`);
}
const final=()=>JSON.stringify(box.C.makeRooms(2).map(r=>[r.x,r.y,r.type,r.links,r.width,r.height]));assert.equal(final(),final());
console.log('PASS: final floor remains fixed with three rooms.');
