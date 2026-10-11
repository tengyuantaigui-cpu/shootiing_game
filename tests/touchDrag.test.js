import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchDrag} from '../src/features/touchDrag.js';
const rect={width:240,height:400};
const e=(id,x,y)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y});
test('相対ドラッグは遠い指で開始しても飛ばず、CSS移動量を論理座標へ変換',()=>{const d=createTouchDrag();assert.deepEqual(d.begin(e(1,30,300),rect,{x:240,y:690}),{x:240,y:690});assert.deepEqual(d.move(e(1,40,290)),{x:260,y:670});assert.deepEqual(d.move(e(1,45,295)),{x:270,y:680});});
test('移動指の所有権、別指の解放・キャンセル・再接触',()=>{const d=createTouchDrag();d.begin(e(1,20,200),rect,{x:240,y:690});assert.equal(d.begin(e(2,50,100),rect,{x:240,y:690}),null);assert.equal(d.move(e(2,50,100)),null);assert.equal(d.end(e(2,0,0)),false);assert.deepEqual(d.move(e(1,30,200)),{x:260,y:690});assert.equal(d.end(e(1,0,0)),true);assert.deepEqual(d.begin(e(3,10,10),rect,{x:260,y:690}),{x:260,y:690});d.reset();assert.equal(d.move(e(3,90,90)),null);});
test('端で押し続けても反転に無駄なドラッグが不要、無効寸法は拒否',()=>{const d=createTouchDrag();d.begin(e(1,0,0),rect,{x:460,y:690});assert.equal(d.move(e(1,300,0)).x,462);assert.equal(d.move(e(1,290,0)).x,442);d.reset();assert.equal(d.begin(e(2,0,0),{width:0,height:0},{x:240,y:690}),null);});
