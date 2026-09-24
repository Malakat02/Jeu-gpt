const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let seed=18273645;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const box={Math:math};vm.runInNewContext(fs.readFileSync('content.js','utf8')+';globalThis.C=ForestContent;',box);
for(const level of [0,1]){
  let total=0;const signatures=new Set(),counts=new Set();
  for(let run=0;run<1000;run++){
    const rooms=box.C.makeRooms(level);total+=rooms.length;counts.add(rooms.length);
    assert.ok(rooms.length>=(level?18:11)&&rooms.length<=(level?22:13));
    assert.equal(new Set(rooms.map(r=>r.x+','+r.y)).size,rooms.length,'no overlapping cells');
    for(const type of ['start','shop','treasure','boss','secret','key','ante'])assert.equal(rooms.filter(r=>r.type===type).length,1,type);
    const boss=rooms.find(r=>r.type==='boss'),secret=rooms.find(r=>r.type==='secret');
    assert.equal(boss.links.length,1);assert.equal(secret.links.length,1);assert.equal(secret.entranceOpen,false);
    const neighbours=rooms.filter(r=>Math.abs(r.x-secret.x)+Math.abs(r.y-secret.y)===1);
    assert.equal(neighbours.length,1,'secret cannot touch any second room or ordinary door');assert.equal(neighbours[0].id,secret.links[0]);assert.notEqual(neighbours[0],boss);
    const seen=new Set([0]),queue=[rooms[0]];
    while(queue.length){const room=queue.shift();for(const id of room.links){const next=rooms[id];assert.ok(next.links.includes(room.id));assert.equal(Math.abs(room.x-next.x)+Math.abs(room.y-next.y),1);if(next===boss||next===secret||seen.has(id))continue;seen.add(id);queue.push(next);}}
    assert.equal(seen.size,rooms.length-2,'key, shop and treasure accessible before boss without secret');
    signatures.add(JSON.stringify(rooms.map(r=>[r.x,r.y,r.type,r.links])));
  }
  assert.ok(Math.abs(total/1000-(level?20:12))<.2);assert.ok(signatures.size>990);assert.equal(counts.size,level?5:3);
  console.log(`PASS: floor ${level+1}, 1000 layouts, average ${total/1000} rooms, ${signatures.size} different plans.`);
}
const final=()=>JSON.stringify(box.C.makeRooms(2).map(r=>[r.x,r.y,r.type,r.links,r.width,r.height]));assert.equal(final(),final());
console.log('PASS: final floor remains fixed with three rooms.');
