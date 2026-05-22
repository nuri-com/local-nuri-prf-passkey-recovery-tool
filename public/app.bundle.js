(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod2) => function __require() {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
    mod2
  ));

  // node_modules/bech32/dist/index.js
  var require_dist = __commonJS({
    "node_modules/bech32/dist/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bech32m = exports.bech32 = void 0;
      var ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
      var ALPHABET_MAP = {};
      for (let z = 0; z < ALPHABET.length; z++) {
        const x = ALPHABET.charAt(z);
        ALPHABET_MAP[x] = z;
      }
      function polymodStep(pre) {
        const b = pre >> 25;
        return (pre & 33554431) << 5 ^ -(b >> 0 & 1) & 996825010 ^ -(b >> 1 & 1) & 642813549 ^ -(b >> 2 & 1) & 513874426 ^ -(b >> 3 & 1) & 1027748829 ^ -(b >> 4 & 1) & 705979059;
      }
      function prefixChk(prefix2) {
        let chk = 1;
        for (let i = 0; i < prefix2.length; ++i) {
          const c = prefix2.charCodeAt(i);
          if (c < 33 || c > 126)
            return "Invalid prefix (" + prefix2 + ")";
          chk = polymodStep(chk) ^ c >> 5;
        }
        chk = polymodStep(chk);
        for (let i = 0; i < prefix2.length; ++i) {
          const v = prefix2.charCodeAt(i);
          chk = polymodStep(chk) ^ v & 31;
        }
        return chk;
      }
      function convert(data, inBits, outBits, pad) {
        let value = 0;
        let bits = 0;
        const maxV = (1 << outBits) - 1;
        const result = [];
        for (let i = 0; i < data.length; ++i) {
          value = value << inBits | data[i];
          bits += inBits;
          while (bits >= outBits) {
            bits -= outBits;
            result.push(value >> bits & maxV);
          }
        }
        if (pad) {
          if (bits > 0) {
            result.push(value << outBits - bits & maxV);
          }
        } else {
          if (bits >= inBits)
            return "Excess padding";
          if (value << outBits - bits & maxV)
            return "Non-zero padding";
        }
        return result;
      }
      function toWords(bytes) {
        return convert(bytes, 8, 5, true);
      }
      function fromWordsUnsafe(words) {
        const res = convert(words, 5, 8, false);
        if (Array.isArray(res))
          return res;
      }
      function fromWords(words) {
        const res = convert(words, 5, 8, false);
        if (Array.isArray(res))
          return res;
        throw new Error(res);
      }
      function getLibraryFromEncoding(encoding) {
        let ENCODING_CONST;
        if (encoding === "bech32") {
          ENCODING_CONST = 1;
        } else {
          ENCODING_CONST = 734539939;
        }
        function encode(prefix2, words, LIMIT) {
          LIMIT = LIMIT || 90;
          if (prefix2.length + 7 + words.length > LIMIT)
            throw new TypeError("Exceeds length limit");
          prefix2 = prefix2.toLowerCase();
          let chk = prefixChk(prefix2);
          if (typeof chk === "string")
            throw new Error(chk);
          let result = prefix2 + "1";
          for (let i = 0; i < words.length; ++i) {
            const x = words[i];
            if (x >> 5 !== 0)
              throw new Error("Non 5-bit word");
            chk = polymodStep(chk) ^ x;
            result += ALPHABET.charAt(x);
          }
          for (let i = 0; i < 6; ++i) {
            chk = polymodStep(chk);
          }
          chk ^= ENCODING_CONST;
          for (let i = 0; i < 6; ++i) {
            const v = chk >> (5 - i) * 5 & 31;
            result += ALPHABET.charAt(v);
          }
          return result;
        }
        function __decode(str, LIMIT) {
          LIMIT = LIMIT || 90;
          if (str.length < 8)
            return str + " too short";
          if (str.length > LIMIT)
            return "Exceeds length limit";
          const lowered = str.toLowerCase();
          const uppered = str.toUpperCase();
          if (str !== lowered && str !== uppered)
            return "Mixed-case string " + str;
          str = lowered;
          const split2 = str.lastIndexOf("1");
          if (split2 === -1)
            return "No separator character for " + str;
          if (split2 === 0)
            return "Missing prefix for " + str;
          const prefix2 = str.slice(0, split2);
          const wordChars = str.slice(split2 + 1);
          if (wordChars.length < 6)
            return "Data too short";
          let chk = prefixChk(prefix2);
          if (typeof chk === "string")
            return chk;
          const words = [];
          for (let i = 0; i < wordChars.length; ++i) {
            const c = wordChars.charAt(i);
            const v = ALPHABET_MAP[c];
            if (v === void 0)
              return "Unknown character " + c;
            chk = polymodStep(chk) ^ v;
            if (i + 6 >= wordChars.length)
              continue;
            words.push(v);
          }
          if (chk !== ENCODING_CONST)
            return "Invalid checksum for " + str;
          return { prefix: prefix2, words };
        }
        function decodeUnsafe(str, LIMIT) {
          const res = __decode(str, LIMIT);
          if (typeof res === "object")
            return res;
        }
        function decode(str, LIMIT) {
          const res = __decode(str, LIMIT);
          if (typeof res === "object")
            return res;
          throw new Error(res);
        }
        return {
          decodeUnsafe,
          decode,
          encode,
          toWords,
          fromWordsUnsafe,
          fromWords
        };
      }
      exports.bech32 = getLibraryFromEncoding("bech32");
      exports.bech32m = getLibraryFromEncoding("bech32m");
    }
  });

  // node_modules/@noble/hashes/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function anumber(n, title = "") {
    if (typeof n !== "number") {
      const prefix2 = title && `"${title}" `;
      throw new TypeError(`${prefix2}expected number, got ${typeof n}`);
    }
    if (!Number.isSafeInteger(n) || n < 0) {
      const prefix2 = title && `"${title}" `;
      throw new RangeError(`${prefix2}expected integer >= 0, got ${n}`);
    }
  }
  function abytes(value, length, title = "") {
    const bytes = isBytes(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix2 = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      const message = prefix2 + "expected Uint8Array" + ofLen + ", got " + got;
      if (!bytes)
        throw new TypeError(message);
      throw new RangeError(message);
    }
    return value;
  }
  function ahash(h) {
    if (typeof h !== "function" || typeof h.create !== "function")
      throw new TypeError("Hash must wrapped by utils.createHasher");
    anumber(h.outputLen);
    anumber(h.blockLen);
    if (h.outputLen < 1)
      throw new Error('"outputLen" must be >= 1');
    if (h.blockLen < 1)
      throw new Error('"blockLen" must be >= 1');
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out, void 0, "digestInto() output");
    const min = instance.outputLen;
    if (out.length < min) {
      throw new RangeError('"digestInto() output" expected to be of length >=' + min);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function rotl(word, shift) {
    return word << shift | word >>> 32 - shift >>> 0;
  }
  var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  var swap32IfBE = isLE ? (u) => u : byteSwap32;
  var hasHexBuiltin = /* @__PURE__ */ (() => (
    // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
  ))();
  var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(bytes) {
    abytes(bytes);
    if (hasHexBuiltin)
      return bytes.toHex();
    let hex2 = "";
    for (let i = 0; i < bytes.length; i++) {
      hex2 += hexes[bytes[i]];
    }
    return hex2;
  }
  var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
  function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
      return ch - asciis._0;
    if (ch >= asciis.A && ch <= asciis.F)
      return ch - (asciis.A - 10);
    if (ch >= asciis.a && ch <= asciis.f)
      return ch - (asciis.a - 10);
    return;
  }
  function hexToBytes(hex2) {
    if (typeof hex2 !== "string")
      throw new TypeError("hex string expected, got " + typeof hex2);
    if (hasHexBuiltin) {
      try {
        return Uint8Array.fromHex(hex2);
      } catch (error) {
        if (error instanceof SyntaxError)
          throw new RangeError(error.message);
        throw error;
      }
    }
    const hl = hex2.length;
    const al = hl / 2;
    if (hl % 2)
      throw new RangeError("hex string expected, got unpadded hex of length " + hl);
    const array2 = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = asciiToBase16(hex2.charCodeAt(hi));
      const n2 = asciiToBase16(hex2.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0) {
        const char = hex2[hi] + hex2[hi + 1];
        throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
      }
      array2[ai] = n1 * 16 + n2;
    }
    return array2;
  }
  function concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes(a);
      sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad);
      pad += a.length;
    }
    return res;
  }
  function createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  function randomBytes(bytesLength = 32) {
    anumber(bytesLength, "bytesLength");
    const cr = typeof globalThis === "object" ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== "function")
      throw new Error("crypto.getRandomValues must be defined");
    if (bytesLength > 65536)
      throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
    return cr.getRandomValues(new Uint8Array(bytesLength));
  }
  var oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
  });

  // node_modules/@noble/hashes/_md.js
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class {
    blockLen;
    outputLen;
    canXOF = false;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE2) {
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE2;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { view: view2, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view2, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view: view2, blockLen, isLE: isLE2 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view2, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      view2.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
      this.process(view2, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen must be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE2);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to ||= new this.constructor();
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length;
      to.pos = pos;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    4089235720,
    3144134277,
    2227873595,
    1013904242,
    4271175723,
    2773480762,
    1595750129,
    1359893119,
    2917565137,
    2600822924,
    725511199,
    528734635,
    4215389547,
    1541459225,
    327033209
  ]);

  // node_modules/@noble/hashes/_u64.js
  var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
  var _32n = /* @__PURE__ */ BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var shrSH = (h, _l, s) => h >>> s;
  var shrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

  // node_modules/@noble/hashes/sha2.js
  var SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA2_32B = class extends HashMD {
    constructor(outputLen) {
      super(64, outputLen, 8, false);
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view2, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view2.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      clean(SHA256_W);
    }
    destroy() {
      this.destroyed = true;
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      clean(this.buffer);
    }
  };
  var _SHA256 = class extends SHA2_32B {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    A = SHA256_IV[0] | 0;
    B = SHA256_IV[1] | 0;
    C = SHA256_IV[2] | 0;
    D = SHA256_IV[3] | 0;
    E = SHA256_IV[4] | 0;
    F = SHA256_IV[5] | 0;
    G = SHA256_IV[6] | 0;
    H = SHA256_IV[7] | 0;
    constructor() {
      super(32);
    }
  };
  var K512 = /* @__PURE__ */ (() => split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n))))();
  var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
  var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
  var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
  var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
  var SHA2_64B = class extends HashMD {
    constructor(outputLen) {
      super(128, outputLen, 16, false);
    }
    // prettier-ignore
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view2, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view2.getUint32(offset);
        SHA512_W_L[i] = view2.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
        const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
        const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
        const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
        const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
        const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = add3L(T1l, sigma0l, MAJl);
        Ah = add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
      this.destroyed = true;
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  };
  var _SHA512 = class extends SHA2_64B {
    Ah = SHA512_IV[0] | 0;
    Al = SHA512_IV[1] | 0;
    Bh = SHA512_IV[2] | 0;
    Bl = SHA512_IV[3] | 0;
    Ch = SHA512_IV[4] | 0;
    Cl = SHA512_IV[5] | 0;
    Dh = SHA512_IV[6] | 0;
    Dl = SHA512_IV[7] | 0;
    Eh = SHA512_IV[8] | 0;
    El = SHA512_IV[9] | 0;
    Fh = SHA512_IV[10] | 0;
    Fl = SHA512_IV[11] | 0;
    Gh = SHA512_IV[12] | 0;
    Gl = SHA512_IV[13] | 0;
    Hh = SHA512_IV[14] | 0;
    Hl = SHA512_IV[15] | 0;
    constructor() {
      super(64);
    }
  };
  var sha256 = /* @__PURE__ */ createHasher(
    () => new _SHA256(),
    /* @__PURE__ */ oidNist(1)
  );
  var sha512 = /* @__PURE__ */ createHasher(
    () => new _SHA512(),
    /* @__PURE__ */ oidNist(3)
  );

  // node_modules/@noble/curves/utils.js
  var abytes2 = (value, length, title) => abytes(value, length, title);
  var anumber2 = anumber;
  var bytesToHex2 = bytesToHex;
  var concatBytes2 = (...arrays) => concatBytes(...arrays);
  var hexToBytes2 = (hex2) => hexToBytes(hex2);
  var isBytes2 = isBytes;
  var randomBytes2 = (bytesLength) => randomBytes(bytesLength);
  var _0n = /* @__PURE__ */ BigInt(0);
  var _1n = /* @__PURE__ */ BigInt(1);
  function abool(value, title = "") {
    if (typeof value !== "boolean") {
      const prefix2 = title && `"${title}" `;
      throw new TypeError(prefix2 + "expected boolean, got type=" + typeof value);
    }
    return value;
  }
  function abignumber(n) {
    if (typeof n === "bigint") {
      if (!isPosBig(n))
        throw new RangeError("positive bigint expected, got " + n);
    } else
      anumber2(n);
    return n;
  }
  function asafenumber(value, title = "") {
    if (typeof value !== "number") {
      const prefix2 = title && `"${title}" `;
      throw new TypeError(prefix2 + "expected number, got type=" + typeof value);
    }
    if (!Number.isSafeInteger(value)) {
      const prefix2 = title && `"${title}" `;
      throw new RangeError(prefix2 + "expected safe integer, got " + value);
    }
  }
  function numberToHexUnpadded(num2) {
    const hex2 = abignumber(num2).toString(16);
    return hex2.length & 1 ? "0" + hex2 : hex2;
  }
  function hexToNumber(hex2) {
    if (typeof hex2 !== "string")
      throw new TypeError("hex string expected, got " + typeof hex2);
    return hex2 === "" ? _0n : BigInt("0x" + hex2);
  }
  function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
  }
  function bytesToNumberLE(bytes) {
    return hexToNumber(bytesToHex(copyBytes(abytes(bytes)).reverse()));
  }
  function numberToBytesBE(n, len) {
    anumber(len);
    if (len === 0)
      throw new RangeError("zero length");
    n = abignumber(n);
    const hex2 = n.toString(16);
    if (hex2.length > len * 2)
      throw new RangeError("number too large");
    return hexToBytes(hex2.padStart(len * 2, "0"));
  }
  function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
  }
  function equalBytes(a, b) {
    a = abytes2(a);
    b = abytes2(b);
    if (a.length !== b.length)
      return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
      diff |= a[i] ^ b[i];
    return diff === 0;
  }
  function copyBytes(bytes) {
    return Uint8Array.from(abytes2(bytes));
  }
  function asciiToBytes(ascii) {
    if (typeof ascii !== "string")
      throw new TypeError("ascii string expected, got " + typeof ascii);
    return Uint8Array.from(ascii, (c, i) => {
      const charCode = c.charCodeAt(0);
      if (c.length !== 1 || charCode > 127) {
        throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
      }
      return charCode;
    });
  }
  var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
  function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
  }
  function aInRange(title, n, min, max) {
    if (!inRange(n, min, max))
      throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
  }
  function bitLen(n) {
    if (n < _0n)
      throw new Error("expected non-negative bigint, got " + n);
    let len;
    for (len = 0; n > _0n; n >>= _1n, len += 1)
      ;
    return len;
  }
  var bitMask = (n) => (_1n << BigInt(n)) - _1n;
  function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    anumber(hashLen, "hashLen");
    anumber(qByteLen, "qByteLen");
    if (typeof hmacFn !== "function")
      throw new TypeError("hmacFn must be a function");
    const u8n = (len) => new Uint8Array(len);
    const NULL2 = Uint8Array.of();
    const byte0 = Uint8Array.of(0);
    const byte1 = Uint8Array.of(1);
    const _maxDrbgIters = 1e3;
    let v = u8n(hashLen);
    let k = u8n(hashLen);
    let i = 0;
    const reset = () => {
      v.fill(1);
      k.fill(0);
      i = 0;
    };
    const h = (...msgs) => hmacFn(k, concatBytes2(v, ...msgs));
    const reseed = (seed = NULL2) => {
      k = h(byte0, seed);
      v = h();
      if (seed.length === 0)
        return;
      k = h(byte1, seed);
      v = h();
    };
    const gen = () => {
      if (i++ >= _maxDrbgIters)
        throw new Error("drbg: tried max amount of iterations");
      let len = 0;
      const out = [];
      while (len < qByteLen) {
        v = h();
        const sl = v.slice();
        out.push(sl);
        len += v.length;
      }
      return concatBytes2(...out);
    };
    const genUntil = (seed, pred) => {
      reset();
      reseed(seed);
      let res = void 0;
      while ((res = pred(gen())) === void 0)
        reseed();
      reset();
      return res;
    };
    return genUntil;
  }
  function validateObject(object, fields = {}, optFields = {}) {
    if (Object.prototype.toString.call(object) !== "[object Object]")
      throw new TypeError("expected valid options object");
    function checkField(fieldName, expectedType, isOpt) {
      if (!isOpt && expectedType !== "function" && !Object.hasOwn(object, fieldName))
        throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
      const val = object[fieldName];
      if (isOpt && val === void 0)
        return;
      const current = typeof val;
      if (current !== expectedType || val === null)
        throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
  }

  // node_modules/@noble/curves/abstract/modular.js
  var _0n2 = /* @__PURE__ */ BigInt(0);
  var _1n2 = /* @__PURE__ */ BigInt(1);
  var _2n = /* @__PURE__ */ BigInt(2);
  var _3n = /* @__PURE__ */ BigInt(3);
  var _4n = /* @__PURE__ */ BigInt(4);
  var _5n = /* @__PURE__ */ BigInt(5);
  var _7n = /* @__PURE__ */ BigInt(7);
  var _8n = /* @__PURE__ */ BigInt(8);
  var _9n = /* @__PURE__ */ BigInt(9);
  var _16n = /* @__PURE__ */ BigInt(16);
  function mod(a, b) {
    if (b <= _0n2)
      throw new Error("mod: expected positive modulus, got " + b);
    const result = a % b;
    return result >= _0n2 ? result : b + result;
  }
  function pow2(x, power, modulo) {
    if (power < _0n2)
      throw new Error("pow2: expected non-negative exponent, got " + power);
    let res = x;
    while (power-- > _0n2) {
      res *= res;
      res %= modulo;
    }
    return res;
  }
  function invert(number, modulo) {
    if (number === _0n2)
      throw new Error("invert: expected non-zero number");
    if (modulo <= _0n2)
      throw new Error("invert: expected positive modulus, got " + modulo);
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
    while (a !== _0n2) {
      const q = b / a;
      const r = b - a * q;
      const m = x - u * q;
      const n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd2 = b;
    if (gcd2 !== _1n2)
      throw new Error("invert: does not exist");
    return mod(x, modulo);
  }
  function assertIsSquare(Fp, root, n) {
    const F = Fp;
    if (!F.eql(F.sqr(root), n))
      throw new Error("Cannot find square root");
  }
  function sqrt3mod4(Fp, n) {
    const F = Fp;
    const p1div4 = (F.ORDER + _1n2) / _4n;
    const root = F.pow(n, p1div4);
    assertIsSquare(F, root, n);
    return root;
  }
  function sqrt5mod8(Fp, n) {
    const F = Fp;
    const p5div8 = (F.ORDER - _5n) / _8n;
    const n2 = F.mul(n, _2n);
    const v = F.pow(n2, p5div8);
    const nv = F.mul(n, v);
    const i = F.mul(F.mul(nv, _2n), v);
    const root = F.mul(nv, F.sub(i, F.ONE));
    assertIsSquare(F, root, n);
    return root;
  }
  function sqrt9mod16(P) {
    const Fp_ = Field(P);
    const tn = tonelliShanks(P);
    const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
    const c2 = tn(Fp_, c1);
    const c3 = tn(Fp_, Fp_.neg(c1));
    const c4 = (P + _7n) / _16n;
    return ((Fp, n) => {
      const F = Fp;
      let tv1 = F.pow(n, c4);
      let tv2 = F.mul(tv1, c1);
      const tv3 = F.mul(tv1, c2);
      const tv4 = F.mul(tv1, c3);
      const e1 = F.eql(F.sqr(tv2), n);
      const e2 = F.eql(F.sqr(tv3), n);
      tv1 = F.cmov(tv1, tv2, e1);
      tv2 = F.cmov(tv4, tv3, e2);
      const e3 = F.eql(F.sqr(tv2), n);
      const root = F.cmov(tv1, tv2, e3);
      assertIsSquare(F, root, n);
      return root;
    });
  }
  function tonelliShanks(P) {
    if (P < _3n)
      throw new Error("sqrt is not defined for small field");
    let Q = P - _1n2;
    let S = 0;
    while (Q % _2n === _0n2) {
      Q /= _2n;
      S++;
    }
    let Z = _2n;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
      if (Z++ > 1e3)
        throw new Error("Cannot find square root: probably non-prime P");
    }
    if (S === 1)
      return sqrt3mod4;
    let cc = _Fp.pow(Z, Q);
    const Q1div2 = (Q + _1n2) / _2n;
    return function tonelliSlow(Fp, n) {
      const F = Fp;
      if (F.is0(n))
        return n;
      if (FpLegendre(F, n) !== 1)
        throw new Error("Cannot find square root");
      let M = S;
      let c = F.mul(F.ONE, cc);
      let t = F.pow(n, Q);
      let R = F.pow(n, Q1div2);
      while (!F.eql(t, F.ONE)) {
        if (F.is0(t))
          return F.ZERO;
        let i = 1;
        let t_tmp = F.sqr(t);
        while (!F.eql(t_tmp, F.ONE)) {
          i++;
          t_tmp = F.sqr(t_tmp);
          if (i === M)
            throw new Error("Cannot find square root");
        }
        const exponent = _1n2 << BigInt(M - i - 1);
        const b = F.pow(c, exponent);
        M = i;
        c = F.sqr(b);
        t = F.mul(t, c);
        R = F.mul(R, b);
      }
      return R;
    };
  }
  function FpSqrt(P) {
    if (P % _4n === _3n)
      return sqrt3mod4;
    if (P % _8n === _5n)
      return sqrt5mod8;
    if (P % _16n === _9n)
      return sqrt9mod16(P);
    return tonelliShanks(P);
  }
  var FIELD_FIELDS = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN"
  ];
  function validateField(field) {
    const initial = {
      ORDER: "bigint",
      BYTES: "number",
      BITS: "number"
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
      map[val] = "function";
      return map;
    }, initial);
    validateObject(field, opts);
    asafenumber(field.BYTES, "BYTES");
    asafenumber(field.BITS, "BITS");
    if (field.BYTES < 1 || field.BITS < 1)
      throw new Error("invalid field: expected BYTES/BITS > 0");
    if (field.ORDER <= _1n2)
      throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
    return field;
  }
  function FpPow(Fp, num2, power) {
    const F = Fp;
    if (power < _0n2)
      throw new Error("invalid exponent, negatives unsupported");
    if (power === _0n2)
      return F.ONE;
    if (power === _1n2)
      return num2;
    let p = F.ONE;
    let d = num2;
    while (power > _0n2) {
      if (power & _1n2)
        p = F.mul(p, d);
      d = F.sqr(d);
      power >>= _1n2;
    }
    return p;
  }
  function FpInvertBatch(Fp, nums, passZero = false) {
    const F = Fp;
    const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
    const multipliedAcc = nums.reduce((acc, num2, i) => {
      if (F.is0(num2))
        return acc;
      inverted[i] = acc;
      return F.mul(acc, num2);
    }, F.ONE);
    const invertedAcc = F.inv(multipliedAcc);
    nums.reduceRight((acc, num2, i) => {
      if (F.is0(num2))
        return acc;
      inverted[i] = F.mul(acc, inverted[i]);
      return F.mul(acc, num2);
    }, invertedAcc);
    return inverted;
  }
  function FpLegendre(Fp, n) {
    const F = Fp;
    const p1mod2 = (F.ORDER - _1n2) / _2n;
    const powered = F.pow(n, p1mod2);
    const yes = F.eql(powered, F.ONE);
    const zero = F.eql(powered, F.ZERO);
    const no = F.eql(powered, F.neg(F.ONE));
    if (!yes && !zero && !no)
      throw new Error("invalid Legendre symbol result");
    return yes ? 1 : zero ? 0 : -1;
  }
  function nLength(n, nBitLength) {
    if (nBitLength !== void 0)
      anumber2(nBitLength);
    if (n <= _0n2)
      throw new Error("invalid n length: expected positive n, got " + n);
    if (nBitLength !== void 0 && nBitLength < 1)
      throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
    const bits = bitLen(n);
    if (nBitLength !== void 0 && nBitLength < bits)
      throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
    const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
  }
  var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
  var _Field = class {
    ORDER;
    BITS;
    BYTES;
    isLE;
    ZERO = _0n2;
    ONE = _1n2;
    _lengths;
    _mod;
    constructor(ORDER, opts = {}) {
      if (ORDER <= _1n2)
        throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
      let _nbitLength = void 0;
      this.isLE = false;
      if (opts != null && typeof opts === "object") {
        if (typeof opts.BITS === "number")
          _nbitLength = opts.BITS;
        if (typeof opts.sqrt === "function")
          Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
        if (typeof opts.isLE === "boolean")
          this.isLE = opts.isLE;
        if (opts.allowedLengths)
          this._lengths = Object.freeze(opts.allowedLengths.slice());
        if (typeof opts.modFromBytes === "boolean")
          this._mod = opts.modFromBytes;
      }
      const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
      if (nByteLength > 2048)
        throw new Error("invalid field: expected ORDER of <= 2048 bytes");
      this.ORDER = ORDER;
      this.BITS = nBitLength;
      this.BYTES = nByteLength;
      Object.freeze(this);
    }
    create(num2) {
      return mod(num2, this.ORDER);
    }
    isValid(num2) {
      if (typeof num2 !== "bigint")
        throw new TypeError("invalid field element: expected bigint, got " + typeof num2);
      return _0n2 <= num2 && num2 < this.ORDER;
    }
    is0(num2) {
      return num2 === _0n2;
    }
    // is valid and invertible
    isValidNot0(num2) {
      return !this.is0(num2) && this.isValid(num2);
    }
    isOdd(num2) {
      return (num2 & _1n2) === _1n2;
    }
    neg(num2) {
      return mod(-num2, this.ORDER);
    }
    eql(lhs, rhs) {
      return lhs === rhs;
    }
    sqr(num2) {
      return mod(num2 * num2, this.ORDER);
    }
    add(lhs, rhs) {
      return mod(lhs + rhs, this.ORDER);
    }
    sub(lhs, rhs) {
      return mod(lhs - rhs, this.ORDER);
    }
    mul(lhs, rhs) {
      return mod(lhs * rhs, this.ORDER);
    }
    pow(num2, power) {
      return FpPow(this, num2, power);
    }
    div(lhs, rhs) {
      return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
    }
    // Same as above, but doesn't normalize
    sqrN(num2) {
      return num2 * num2;
    }
    addN(lhs, rhs) {
      return lhs + rhs;
    }
    subN(lhs, rhs) {
      return lhs - rhs;
    }
    mulN(lhs, rhs) {
      return lhs * rhs;
    }
    inv(num2) {
      return invert(num2, this.ORDER);
    }
    sqrt(num2) {
      let sqrt = FIELD_SQRT.get(this);
      if (!sqrt)
        FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
      return sqrt(this, num2);
    }
    toBytes(num2) {
      return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
    }
    fromBytes(bytes, skipValidation = false) {
      abytes2(bytes);
      const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
      if (allowedLengths) {
        if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
          throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
        }
        const padded = new Uint8Array(BYTES);
        padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
        bytes = padded;
      }
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      if (modFromBytes)
        scalar = mod(scalar, ORDER);
      if (!skipValidation) {
        if (!this.isValid(scalar))
          throw new Error("invalid field element: outside of range 0..ORDER");
      }
      return scalar;
    }
    // TODO: we don't need it here, move out to separate fn
    invertBatch(lst) {
      return FpInvertBatch(this, lst);
    }
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov(a, b, condition) {
      abool(condition, "condition");
      return condition ? b : a;
    }
  };
  Object.freeze(_Field.prototype);
  function Field(ORDER, opts = {}) {
    return new _Field(ORDER, opts);
  }
  function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== "bigint")
      throw new Error("field order must be bigint");
    if (fieldOrder <= _1n2)
      throw new Error("field order must be greater than 1");
    const bitLength = bitLen(fieldOrder - _1n2);
    return Math.ceil(bitLength / 8);
  }
  function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
  }
  function mapHashToField(key, fieldOrder, isLE2 = false) {
    abytes2(key);
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = Math.max(getMinHashLength(fieldOrder), 16);
    if (len < minLen || len > 1024)
      throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
    const num2 = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
    const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
    return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
  }

  // node_modules/@noble/curves/abstract/curve.js
  var _0n3 = /* @__PURE__ */ BigInt(0);
  var _1n3 = /* @__PURE__ */ BigInt(1);
  function negateCt(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
  }
  function normalizeZ(c, points) {
    const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
    return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
  }
  function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
      throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
  }
  function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1;
    const windowSize = 2 ** (W - 1);
    const maxNumber = 2 ** W;
    const mask = bitMask(W);
    const shiftBy = BigInt(W);
    return { windows, windowSize, mask, maxNumber, shiftBy };
  }
  function calcOffsets(n, window2, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask);
    let nextN = n >> shiftBy;
    if (wbits > windowSize) {
      wbits -= maxNumber;
      nextN += _1n3;
    }
    const offsetStart = window2 * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1;
    const isZero2 = wbits === 0;
    const isNeg = wbits < 0;
    const isNegF = window2 % 2 !== 0;
    const offsetF = offsetStart;
    return { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF };
  }
  var pointPrecomputes = /* @__PURE__ */ new WeakMap();
  var pointWindowSizes = /* @__PURE__ */ new WeakMap();
  function getW(P) {
    return pointWindowSizes.get(P) || 1;
  }
  function assert0(n) {
    if (n !== _0n3)
      throw new Error("invalid wNAF");
  }
  var wNAF = class {
    BASE;
    ZERO;
    Fn;
    bits;
    // Parametrized with a given Point class (not individual point)
    constructor(Point4, bits) {
      this.BASE = Point4.BASE;
      this.ZERO = Point4.ZERO;
      this.Fn = Point4.Fn;
      this.bits = bits;
    }
    // non-const time multiplication ladder
    _unsafeLadder(elm, n, p = this.ZERO) {
      let d = elm;
      while (n > _0n3) {
        if (n & _1n3)
          p = p.add(d);
        d = d.double();
        n >>= _1n3;
      }
      return p;
    }
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param point - Point instance
     * @param W - window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(point, W) {
      const { windows, windowSize } = calcWOpts(W, this.bits);
      const points = [];
      let p = point;
      let base = p;
      for (let window2 = 0; window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1; i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    }
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * More compact implementation:
     * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      if (!this.Fn.isValid(n))
        throw new Error("invalid scalar");
      let p = this.ZERO;
      let f = this.BASE;
      const wo = calcWOpts(W, this.bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        const { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero2) {
          f = f.add(negateCt(isNegF, precomputes[offsetF]));
        } else {
          p = p.add(negateCt(isNeg, precomputes[offset]));
        }
      }
      assert0(n);
      return { p, f };
    }
    /**
     * Implements unsafe EC multiplication using precomputed tables
     * and w-ary non-adjacent form.
     * @param acc - accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
      const wo = calcWOpts(W, this.bits);
      for (let window2 = 0; window2 < wo.windows; window2++) {
        if (n === _0n3)
          break;
        const { nextN, offset, isZero: isZero2, isNeg } = calcOffsets(n, window2, wo);
        n = nextN;
        if (isZero2) {
          continue;
        } else {
          const item = precomputes[offset];
          acc = acc.add(isNeg ? item.negate() : item);
        }
      }
      assert0(n);
      return acc;
    }
    getPrecomputes(W, point, transform) {
      let comp = pointPrecomputes.get(point);
      if (!comp) {
        comp = this.precomputeWindow(point, W);
        if (W !== 1) {
          if (typeof transform === "function")
            comp = transform(comp);
          pointPrecomputes.set(point, comp);
        }
      }
      return comp;
    }
    cached(point, scalar, transform) {
      const W = getW(point);
      return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
    }
    unsafe(point, scalar, transform, prev) {
      const W = getW(point);
      if (W === 1)
        return this._unsafeLadder(point, scalar, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
    }
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    createCache(P, W) {
      validateW(W, this.bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
    hasCache(elm) {
      return getW(elm) !== 1;
    }
  };
  function mulEndoUnsafe(Point4, point, k1, k2) {
    let acc = point;
    let p1 = Point4.ZERO;
    let p2 = Point4.ZERO;
    while (k1 > _0n3 || k2 > _0n3) {
      if (k1 & _1n3)
        p1 = p1.add(acc);
      if (k2 & _1n3)
        p2 = p2.add(acc);
      acc = acc.double();
      k1 >>= _1n3;
      k2 >>= _1n3;
    }
    return { p1, p2 };
  }
  function createField(order, field, isLE2) {
    if (field) {
      if (field.ORDER !== order)
        throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
      validateField(field);
      return field;
    } else {
      return Field(order, { isLE: isLE2 });
    }
  }
  function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
    if (FpFnLE === void 0)
      FpFnLE = type === "edwards";
    if (!CURVE || typeof CURVE !== "object")
      throw new Error(`expected valid ${type} CURVE object`);
    for (const p of ["p", "n", "h"]) {
      const val = CURVE[p];
      if (!(typeof val === "bigint" && val > _0n3))
        throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
    const Fn3 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
    const _b = type === "weierstrass" ? "b" : "d";
    const params = ["Gx", "Gy", "a", _b];
    for (const p of params) {
      if (!Fp.isValid(CURVE[p]))
        throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    CURVE = Object.freeze(Object.assign({}, CURVE));
    return { CURVE, Fp, Fn: Fn3 };
  }
  function createKeygen(randomSecretKey, getPublicKey) {
    return function keygen(seed) {
      const secretKey = randomSecretKey(seed);
      return { secretKey, publicKey: getPublicKey(secretKey) };
    };
  }

  // node_modules/@noble/hashes/hmac.js
  var _HMAC = class {
    oHash;
    iHash;
    blockLen;
    outputLen;
    canXOF = false;
    finished = false;
    destroyed = false;
    constructor(hash, key) {
      ahash(hash);
      abytes(key, void 0, "key");
      this.iHash = hash.create();
      if (typeof this.iHash.update !== "function")
        throw new Error("Expected instance of class which extends utils.Hash");
      this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const blockLen = this.blockLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash.create();
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54 ^ 92;
      this.oHash.update(pad);
      clean(pad);
    }
    update(buf) {
      aexists(this);
      this.iHash.update(buf);
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const buf = out.subarray(0, this.outputLen);
      this.iHash.digestInto(buf);
      this.oHash.update(buf);
      this.oHash.digestInto(buf);
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.oHash.outputLen);
      this.digestInto(out);
      return out;
    }
    _cloneInto(to) {
      to ||= Object.create(Object.getPrototypeOf(this), {});
      const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
      to = to;
      to.finished = finished;
      to.destroyed = destroyed;
      to.blockLen = blockLen;
      to.outputLen = outputLen;
      to.oHash = oHash._cloneInto(to.oHash);
      to.iHash = iHash._cloneInto(to.iHash);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
    destroy() {
      this.destroyed = true;
      this.oHash.destroy();
      this.iHash.destroy();
    }
  };
  var hmac = /* @__PURE__ */ (() => {
    const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
    hmac_.create = (hash, key) => new _HMAC(hash, key);
    return hmac_;
  })();

  // node_modules/@noble/curves/abstract/weierstrass.js
  var divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
  function _splitEndoScalar(k, basis, n) {
    aInRange("scalar", k, _0n4, n);
    const [[a1, b1], [a2, b2]] = basis;
    const c1 = divNearest(b2 * k, n);
    const c2 = divNearest(-b1 * k, n);
    let k1 = k - c1 * a1 - c2 * a2;
    let k2 = -c1 * b1 - c2 * b2;
    const k1neg = k1 < _0n4;
    const k2neg = k2 < _0n4;
    if (k1neg)
      k1 = -k1;
    if (k2neg)
      k2 = -k2;
    const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
    if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
      throw new Error("splitScalar (endomorphism): failed for k");
    }
    return { k1neg, k1, k2neg, k2 };
  }
  function validateSigFormat(format) {
    if (!["compact", "recovered", "der"].includes(format))
      throw new Error('Signature format must be "compact", "recovered", or "der"');
    return format;
  }
  function validateSigOpts(opts, def) {
    validateObject(opts);
    const optsn = {};
    for (let optName of Object.keys(def)) {
      optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
    }
    abool(optsn.lowS, "lowS");
    abool(optsn.prehash, "prehash");
    if (optsn.format !== void 0)
      validateSigFormat(optsn.format);
    return optsn;
  }
  var DERErr = class extends Error {
    constructor(m = "") {
      super(m);
    }
  };
  var DER = {
    // asn.1 DER encoding utils
    Err: DERErr,
    // Basic building block is TLV (Tag-Length-Value)
    _tlv: {
      encode: (tag, data) => {
        const { Err: E } = DER;
        asafenumber(tag, "tag");
        if (tag < 0 || tag > 255)
          throw new E("tlv.encode: wrong tag");
        if (typeof data !== "string")
          throw new TypeError('"data" expected string, got type=' + typeof data);
        if (data.length & 1)
          throw new E("tlv.encode: unpadded data");
        const dataLen = data.length / 2;
        const len = numberToHexUnpadded(dataLen);
        if (len.length / 2 & 128)
          throw new E("tlv.encode: long form length too big");
        const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
        const t = numberToHexUnpadded(tag);
        return t + lenLen + len + data;
      },
      // v - value, l - left bytes (unparsed)
      decode(tag, data) {
        const { Err: E } = DER;
        data = abytes2(data, void 0, "DER data");
        let pos = 0;
        if (tag < 0 || tag > 255)
          throw new E("tlv.encode: wrong tag");
        if (data.length < 2 || data[pos++] !== tag)
          throw new E("tlv.decode: wrong tlv");
        const first = data[pos++];
        const isLong = !!(first & 128);
        let length = 0;
        if (!isLong)
          length = first;
        else {
          const lenLen = first & 127;
          if (!lenLen)
            throw new E("tlv.decode(long): indefinite length not supported");
          if (lenLen > 4)
            throw new E("tlv.decode(long): byte length is too big");
          const lengthBytes = data.subarray(pos, pos + lenLen);
          if (lengthBytes.length !== lenLen)
            throw new E("tlv.decode: length bytes not complete");
          if (lengthBytes[0] === 0)
            throw new E("tlv.decode(long): zero leftmost byte");
          for (const b of lengthBytes)
            length = length << 8 | b;
          pos += lenLen;
          if (length < 128)
            throw new E("tlv.decode(long): not minimal encoding");
        }
        const v = data.subarray(pos, pos + length);
        if (v.length !== length)
          throw new E("tlv.decode: wrong value length");
        return { v, l: data.subarray(pos + length) };
      }
    },
    // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
    // since we always use positive integers here. It must always be empty:
    // - add zero byte if exists
    // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
    _int: {
      encode(num2) {
        const { Err: E } = DER;
        abignumber(num2);
        if (num2 < _0n4)
          throw new E("integer: negative integers are not allowed");
        let hex2 = numberToHexUnpadded(num2);
        if (Number.parseInt(hex2[0], 16) & 8)
          hex2 = "00" + hex2;
        if (hex2.length & 1)
          throw new E("unexpected DER parsing assertion: unpadded hex");
        return hex2;
      },
      decode(data) {
        const { Err: E } = DER;
        if (data.length < 1)
          throw new E("invalid signature integer: empty");
        if (data[0] & 128)
          throw new E("invalid signature integer: negative");
        if (data.length > 1 && data[0] === 0 && !(data[1] & 128))
          throw new E("invalid signature integer: unnecessary leading zero");
        return bytesToNumberBE(data);
      }
    },
    toSig(bytes) {
      const { Err: E, _int: int, _tlv: tlv } = DER;
      const data = abytes2(bytes, void 0, "signature");
      const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
      if (seqLeftBytes.length)
        throw new E("invalid signature: left bytes after parsing");
      const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
      const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
      if (sLeftBytes.length)
        throw new E("invalid signature: left bytes after parsing");
      return { r: int.decode(rBytes), s: int.decode(sBytes) };
    },
    hexFromSig(sig) {
      const { _tlv: tlv, _int: int } = DER;
      const rs = tlv.encode(2, int.encode(sig.r));
      const ss = tlv.encode(2, int.encode(sig.s));
      const seq = rs + ss;
      return tlv.encode(48, seq);
    }
  };
  Object.freeze(DER._tlv);
  Object.freeze(DER._int);
  Object.freeze(DER);
  var _0n4 = /* @__PURE__ */ BigInt(0);
  var _1n4 = /* @__PURE__ */ BigInt(1);
  var _2n2 = /* @__PURE__ */ BigInt(2);
  var _3n2 = /* @__PURE__ */ BigInt(3);
  var _4n2 = /* @__PURE__ */ BigInt(4);
  function weierstrass(params, extraOpts = {}) {
    const validated = createCurveFields("weierstrass", params, extraOpts);
    const Fp = validated.Fp;
    const Fn3 = validated.Fn;
    let CURVE = validated.CURVE;
    const { h: cofactor, n: CURVE_ORDER2 } = CURVE;
    validateObject(extraOpts, {}, {
      allowInfinityPoint: "boolean",
      clearCofactor: "function",
      isTorsionFree: "function",
      fromBytes: "function",
      toBytes: "function",
      endo: "object"
    });
    const { endo, allowInfinityPoint } = extraOpts;
    if (endo) {
      if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
        throw new Error('invalid endo: expected "beta": bigint and "basises": array');
      }
    }
    const lengths = getWLengths(Fp, Fn3);
    function assertCompressionIsSupported() {
      if (!Fp.isOdd)
        throw new Error("compression is not supported: Field does not have .isOdd()");
    }
    function pointToBytes3(_c, point, isCompressed) {
      if (allowInfinityPoint && point.is0())
        return Uint8Array.of(0);
      const { x, y } = point.toAffine();
      const bx = Fp.toBytes(x);
      abool(isCompressed, "isCompressed");
      if (isCompressed) {
        assertCompressionIsSupported();
        const hasEvenY = !Fp.isOdd(y);
        return concatBytes2(pprefix(hasEvenY), bx);
      } else {
        return concatBytes2(Uint8Array.of(4), bx, Fp.toBytes(y));
      }
    }
    function pointFromBytes(bytes) {
      abytes2(bytes, void 0, "Point");
      const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
      const length = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      if (allowInfinityPoint && length === 1 && head === 0)
        return { x: Fp.ZERO, y: Fp.ZERO };
      if (length === comp && (head === 2 || head === 3)) {
        const x = Fp.fromBytes(tail);
        if (!Fp.isValid(x))
          throw new Error("bad point: is not on curve, wrong x");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp.sqrt(y2);
        } catch (sqrtError) {
          const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("bad point: is not on curve, sqrt error" + err);
        }
        assertCompressionIsSupported();
        const evenY = Fp.isOdd(y);
        const evenH = (head & 1) === 1;
        if (evenH !== evenY)
          y = Fp.neg(y);
        return { x, y };
      } else if (length === uncomp && head === 4) {
        const L = Fp.BYTES;
        const x = Fp.fromBytes(tail.subarray(0, L));
        const y = Fp.fromBytes(tail.subarray(L, L * 2));
        if (!isValidXY(x, y))
          throw new Error("bad point: is not on curve");
        return { x, y };
      } else {
        throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
      }
    }
    const encodePoint = extraOpts.toBytes === void 0 ? pointToBytes3 : extraOpts.toBytes;
    const decodePoint = extraOpts.fromBytes === void 0 ? pointFromBytes : extraOpts.fromBytes;
    function weierstrassEquation(x) {
      const x2 = Fp.sqr(x);
      const x3 = Fp.mul(x2, x);
      return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
    }
    function isValidXY(x, y) {
      const left = Fp.sqr(y);
      const right = weierstrassEquation(x);
      return Fp.eql(left, right);
    }
    if (!isValidXY(CURVE.Gx, CURVE.Gy))
      throw new Error("bad curve params: generator point");
    const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
    const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
    if (Fp.is0(Fp.add(_4a3, _27b2)))
      throw new Error("bad curve params: a or b");
    function acoord(title, n, banZero = false) {
      if (!Fp.isValid(n) || banZero && Fp.is0(n))
        throw new Error(`bad point coordinate ${title}`);
      return n;
    }
    function aprjpoint(other) {
      if (!(other instanceof Point4))
        throw new Error("Weierstrass Point expected");
    }
    function splitEndoScalarN(k) {
      if (!endo || !endo.basises)
        throw new Error("no endo");
      return _splitEndoScalar(k, endo.basises, Fn3.ORDER);
    }
    function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
      k2p = new Point4(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
      k1p = negateCt(k1neg, k1p);
      k2p = negateCt(k2neg, k2p);
      return k1p.add(k2p);
    }
    class Point4 {
      // base / generator point
      static BASE = new Point4(CURVE.Gx, CURVE.Gy, Fp.ONE);
      // zero / infinity / identity point
      static ZERO = new Point4(Fp.ZERO, Fp.ONE, Fp.ZERO);
      // 0, 1, 0
      // math field
      static Fp = Fp;
      // scalar field
      static Fn = Fn3;
      X;
      Y;
      Z;
      /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
      constructor(X, Y, Z) {
        this.X = acoord("x", X);
        this.Y = acoord("y", Y, true);
        this.Z = acoord("z", Z);
        Object.freeze(this);
      }
      static CURVE() {
        return CURVE;
      }
      /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
      static fromAffine(p) {
        const { x, y } = p || {};
        if (!p || !Fp.isValid(x) || !Fp.isValid(y))
          throw new Error("invalid affine point");
        if (p instanceof Point4)
          throw new Error("projective point not allowed");
        if (Fp.is0(x) && Fp.is0(y))
          return Point4.ZERO;
        return new Point4(x, y, Fp.ONE);
      }
      static fromBytes(bytes) {
        const P = Point4.fromAffine(decodePoint(abytes2(bytes, void 0, "point")));
        P.assertValidity();
        return P;
      }
      static fromHex(hex2) {
        return Point4.fromBytes(hexToBytes2(hex2));
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      /**
       *
       * @param windowSize
       * @param isLazy - true will defer table computation until the first multiplication
       * @returns
       */
      precompute(windowSize = 8, isLazy = true) {
        wnaf.createCache(this, windowSize);
        if (!isLazy)
          this.multiply(_3n2);
        return this;
      }
      // TODO: return `this`
      /** A point on curve is valid if it conforms to equation. */
      assertValidity() {
        const p = this;
        if (p.is0()) {
          if (extraOpts.allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z))
            return;
          throw new Error("bad point: ZERO");
        }
        const { x, y } = p.toAffine();
        if (!Fp.isValid(x) || !Fp.isValid(y))
          throw new Error("bad point: x or y not field elements");
        if (!isValidXY(x, y))
          throw new Error("bad point: equation left != right");
        if (!p.isTorsionFree())
          throw new Error("bad point: not in prime-order subgroup");
      }
      hasEvenY() {
        const { y } = this.toAffine();
        if (!Fp.isOdd)
          throw new Error("Field doesn't support isOdd");
        return !Fp.isOdd(y);
      }
      /** Compare one point to another. */
      equals(other) {
        aprjpoint(other);
        const { X: X1, Y: Y1, Z: Z1 } = this;
        const { X: X2, Y: Y2, Z: Z2 } = other;
        const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
        const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
        return U1 && U2;
      }
      /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
      negate() {
        return new Point4(this.X, Fp.neg(this.Y), this.Z);
      }
      // Renes-Costello-Batina exception-free doubling formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 3
      // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
      double() {
        const { a, b } = CURVE;
        const b3 = Fp.mul(b, _3n2);
        const { X: X1, Y: Y1, Z: Z1 } = this;
        let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
        let t0 = Fp.mul(X1, X1);
        let t1 = Fp.mul(Y1, Y1);
        let t2 = Fp.mul(Z1, Z1);
        let t3 = Fp.mul(X1, Y1);
        t3 = Fp.add(t3, t3);
        Z3 = Fp.mul(X1, Z1);
        Z3 = Fp.add(Z3, Z3);
        X3 = Fp.mul(a, Z3);
        Y3 = Fp.mul(b3, t2);
        Y3 = Fp.add(X3, Y3);
        X3 = Fp.sub(t1, Y3);
        Y3 = Fp.add(t1, Y3);
        Y3 = Fp.mul(X3, Y3);
        X3 = Fp.mul(t3, X3);
        Z3 = Fp.mul(b3, Z3);
        t2 = Fp.mul(a, t2);
        t3 = Fp.sub(t0, t2);
        t3 = Fp.mul(a, t3);
        t3 = Fp.add(t3, Z3);
        Z3 = Fp.add(t0, t0);
        t0 = Fp.add(Z3, t0);
        t0 = Fp.add(t0, t2);
        t0 = Fp.mul(t0, t3);
        Y3 = Fp.add(Y3, t0);
        t2 = Fp.mul(Y1, Z1);
        t2 = Fp.add(t2, t2);
        t0 = Fp.mul(t2, t3);
        X3 = Fp.sub(X3, t0);
        Z3 = Fp.mul(t2, t1);
        Z3 = Fp.add(Z3, Z3);
        Z3 = Fp.add(Z3, Z3);
        return new Point4(X3, Y3, Z3);
      }
      // Renes-Costello-Batina exception-free addition formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 1
      // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
      add(other) {
        aprjpoint(other);
        const { X: X1, Y: Y1, Z: Z1 } = this;
        const { X: X2, Y: Y2, Z: Z2 } = other;
        let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
        const a = CURVE.a;
        const b3 = Fp.mul(CURVE.b, _3n2);
        let t0 = Fp.mul(X1, X2);
        let t1 = Fp.mul(Y1, Y2);
        let t2 = Fp.mul(Z1, Z2);
        let t3 = Fp.add(X1, Y1);
        let t4 = Fp.add(X2, Y2);
        t3 = Fp.mul(t3, t4);
        t4 = Fp.add(t0, t1);
        t3 = Fp.sub(t3, t4);
        t4 = Fp.add(X1, Z1);
        let t5 = Fp.add(X2, Z2);
        t4 = Fp.mul(t4, t5);
        t5 = Fp.add(t0, t2);
        t4 = Fp.sub(t4, t5);
        t5 = Fp.add(Y1, Z1);
        X3 = Fp.add(Y2, Z2);
        t5 = Fp.mul(t5, X3);
        X3 = Fp.add(t1, t2);
        t5 = Fp.sub(t5, X3);
        Z3 = Fp.mul(a, t4);
        X3 = Fp.mul(b3, t2);
        Z3 = Fp.add(X3, Z3);
        X3 = Fp.sub(t1, Z3);
        Z3 = Fp.add(t1, Z3);
        Y3 = Fp.mul(X3, Z3);
        t1 = Fp.add(t0, t0);
        t1 = Fp.add(t1, t0);
        t2 = Fp.mul(a, t2);
        t4 = Fp.mul(b3, t4);
        t1 = Fp.add(t1, t2);
        t2 = Fp.sub(t0, t2);
        t2 = Fp.mul(a, t2);
        t4 = Fp.add(t4, t2);
        t0 = Fp.mul(t1, t4);
        Y3 = Fp.add(Y3, t0);
        t0 = Fp.mul(t5, t4);
        X3 = Fp.mul(t3, X3);
        X3 = Fp.sub(X3, t0);
        t0 = Fp.mul(t3, t1);
        Z3 = Fp.mul(t5, Z3);
        Z3 = Fp.add(Z3, t0);
        return new Point4(X3, Y3, Z3);
      }
      subtract(other) {
        aprjpoint(other);
        return this.add(other.negate());
      }
      is0() {
        return this.equals(Point4.ZERO);
      }
      /**
       * Constant time multiplication.
       * Uses wNAF method. Windowed method may be 10% faster,
       * but takes 2x longer to generate and consumes 2x memory.
       * Uses precomputes when available.
       * Uses endomorphism for Koblitz curves.
       * @param scalar - by which the point would be multiplied
       * @returns New point
       */
      multiply(scalar) {
        const { endo: endo2 } = extraOpts;
        if (!Fn3.isValidNot0(scalar))
          throw new RangeError("invalid scalar: out of range");
        let point, fake;
        const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point4, p));
        if (endo2) {
          const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
          const { p: k1p, f: k1f } = mul(k1);
          const { p: k2p, f: k2f } = mul(k2);
          fake = k1f.add(k2f);
          point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
        } else {
          const { p, f } = mul(scalar);
          point = p;
          fake = f;
        }
        return normalizeZ(Point4, [point, fake])[0];
      }
      /**
       * Non-constant-time multiplication. Uses double-and-add algorithm.
       * It's faster, but should only be used when you don't care about
       * an exposed secret key e.g. sig verification, which works over *public* keys.
       */
      multiplyUnsafe(scalar) {
        const { endo: endo2 } = extraOpts;
        const p = this;
        const sc = scalar;
        if (!Fn3.isValid(sc))
          throw new RangeError("invalid scalar: out of range");
        if (sc === _0n4 || p.is0())
          return Point4.ZERO;
        if (sc === _1n4)
          return p;
        if (wnaf.hasCache(this))
          return this.multiply(sc);
        if (endo2) {
          const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
          const { p1, p2 } = mulEndoUnsafe(Point4, p, k1, k2);
          return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
        } else {
          return wnaf.unsafe(p, sc);
        }
      }
      /**
       * Converts Projective point to affine (x, y) coordinates.
       * (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
       * @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
       */
      toAffine(invertedZ) {
        const p = this;
        let iz = invertedZ;
        const { X, Y, Z } = p;
        if (Fp.eql(Z, Fp.ONE))
          return { x: X, y: Y };
        const is0 = p.is0();
        if (iz == null)
          iz = is0 ? Fp.ONE : Fp.inv(Z);
        const x = Fp.mul(X, iz);
        const y = Fp.mul(Y, iz);
        const zz = Fp.mul(Z, iz);
        if (is0)
          return { x: Fp.ZERO, y: Fp.ZERO };
        if (!Fp.eql(zz, Fp.ONE))
          throw new Error("invZ was invalid");
        return { x, y };
      }
      /**
       * Checks whether Point is free of torsion elements (is in prime subgroup).
       * Always torsion-free for cofactor=1 curves.
       */
      isTorsionFree() {
        const { isTorsionFree } = extraOpts;
        if (cofactor === _1n4)
          return true;
        if (isTorsionFree)
          return isTorsionFree(Point4, this);
        return wnaf.unsafe(this, CURVE_ORDER2).is0();
      }
      clearCofactor() {
        const { clearCofactor } = extraOpts;
        if (cofactor === _1n4)
          return this;
        if (clearCofactor)
          return clearCofactor(Point4, this);
        return this.multiplyUnsafe(cofactor);
      }
      isSmallOrder() {
        if (cofactor === _1n4)
          return this.is0();
        return this.clearCofactor().is0();
      }
      toBytes(isCompressed = true) {
        abool(isCompressed, "isCompressed");
        this.assertValidity();
        return encodePoint(Point4, this, isCompressed);
      }
      toHex(isCompressed = true) {
        return bytesToHex2(this.toBytes(isCompressed));
      }
      toString() {
        return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
      }
    }
    const bits = Fn3.BITS;
    const wnaf = new wNAF(Point4, extraOpts.endo ? Math.ceil(bits / 2) : bits);
    if (bits >= 8)
      Point4.BASE.precompute(8);
    Object.freeze(Point4.prototype);
    Object.freeze(Point4);
    return Point4;
  }
  function pprefix(hasEvenY) {
    return Uint8Array.of(hasEvenY ? 2 : 3);
  }
  function getWLengths(Fp, Fn3) {
    return {
      secretKey: Fn3.BYTES,
      publicKey: 1 + Fp.BYTES,
      publicKeyUncompressed: 1 + 2 * Fp.BYTES,
      publicKeyHasPrefix: true,
      // Raw compact `(r || s)` signature width; DER and recovered signatures use
      // different lengths outside this helper.
      signature: 2 * Fn3.BYTES
    };
  }
  function ecdh(Point4, ecdhOpts = {}) {
    const { Fn: Fn3 } = Point4;
    const randomBytes_ = ecdhOpts.randomBytes === void 0 ? randomBytes2 : ecdhOpts.randomBytes;
    const lengths = Object.assign(getWLengths(Point4.Fp, Fn3), {
      seed: Math.max(getMinHashLength(Fn3.ORDER), 16)
    });
    function isValidSecretKey(secretKey) {
      try {
        const num2 = Fn3.fromBytes(secretKey);
        return Fn3.isValidNot0(num2);
      } catch (error) {
        return false;
      }
    }
    function isValidPublicKey(publicKey, isCompressed) {
      const { publicKey: comp, publicKeyUncompressed } = lengths;
      try {
        const l = publicKey.length;
        if (isCompressed === true && l !== comp)
          return false;
        if (isCompressed === false && l !== publicKeyUncompressed)
          return false;
        return !!Point4.fromBytes(publicKey);
      } catch (error) {
        return false;
      }
    }
    function randomSecretKey(seed) {
      seed = seed === void 0 ? randomBytes_(lengths.seed) : seed;
      return mapHashToField(abytes2(seed, lengths.seed, "seed"), Fn3.ORDER);
    }
    function getPublicKey(secretKey, isCompressed = true) {
      return Point4.BASE.multiply(Fn3.fromBytes(secretKey)).toBytes(isCompressed);
    }
    function isProbPub(item) {
      const { secretKey, publicKey, publicKeyUncompressed } = lengths;
      const allowedLengths = Fn3._lengths;
      if (!isBytes2(item))
        return void 0;
      const l = abytes2(item, void 0, "key").length;
      const isPub = l === publicKey || l === publicKeyUncompressed;
      const isSec = l === secretKey || !!allowedLengths?.includes(l);
      if (isPub && isSec)
        return void 0;
      return isPub;
    }
    function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
      if (isProbPub(secretKeyA) === true)
        throw new Error("first arg must be private key");
      if (isProbPub(publicKeyB) === false)
        throw new Error("second arg must be public key");
      const s = Fn3.fromBytes(secretKeyA);
      const b = Point4.fromBytes(publicKeyB);
      return b.multiply(s).toBytes(isCompressed);
    }
    const utils2 = {
      isValidSecretKey,
      isValidPublicKey,
      randomSecretKey
    };
    const keygen = createKeygen(randomSecretKey, getPublicKey);
    Object.freeze(utils2);
    Object.freeze(lengths);
    return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point: Point4, utils: utils2, lengths });
  }
  function ecdsa(Point4, hash, ecdsaOpts = {}) {
    const hash_ = hash;
    ahash(hash_);
    validateObject(ecdsaOpts, {}, {
      hmac: "function",
      lowS: "boolean",
      randomBytes: "function",
      bits2int: "function",
      bits2int_modN: "function"
    });
    ecdsaOpts = Object.assign({}, ecdsaOpts);
    const randomBytes3 = ecdsaOpts.randomBytes === void 0 ? randomBytes2 : ecdsaOpts.randomBytes;
    const hmac2 = ecdsaOpts.hmac === void 0 ? (key, msg) => hmac(hash_, key, msg) : ecdsaOpts.hmac;
    const { Fp, Fn: Fn3 } = Point4;
    const { ORDER: CURVE_ORDER2, BITS: fnBits } = Fn3;
    const { keygen, getPublicKey, getSharedSecret, utils: utils2, lengths } = ecdh(Point4, ecdsaOpts);
    const defaultSigOpts = {
      prehash: true,
      lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
      format: "compact",
      extraEntropy: false
    };
    const hasLargeRecoveryLifts = CURVE_ORDER2 * _2n2 + _1n4 < Fp.ORDER;
    function isBiggerThanHalfOrder(number) {
      const HALF = CURVE_ORDER2 >> _1n4;
      return number > HALF;
    }
    function validateRS(title, num2) {
      if (!Fn3.isValidNot0(num2))
        throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
      return num2;
    }
    function assertRecoverableCurve() {
      if (hasLargeRecoveryLifts)
        throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
    }
    function validateSigLength(bytes, format) {
      validateSigFormat(format);
      const size = lengths.signature;
      const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
      return abytes2(bytes, sizer);
    }
    class Signature {
      r;
      s;
      recovery;
      constructor(r, s, recovery) {
        this.r = validateRS("r", r);
        this.s = validateRS("s", s);
        if (recovery != null) {
          assertRecoverableCurve();
          if (![0, 1, 2, 3].includes(recovery))
            throw new Error("invalid recovery id");
          this.recovery = recovery;
        }
        Object.freeze(this);
      }
      static fromBytes(bytes, format = defaultSigOpts.format) {
        validateSigLength(bytes, format);
        let recid;
        if (format === "der") {
          const { r: r2, s: s2 } = DER.toSig(abytes2(bytes));
          return new Signature(r2, s2);
        }
        if (format === "recovered") {
          recid = bytes[0];
          format = "compact";
          bytes = bytes.subarray(1);
        }
        const L = lengths.signature / 2;
        const r = bytes.subarray(0, L);
        const s = bytes.subarray(L, L * 2);
        return new Signature(Fn3.fromBytes(r), Fn3.fromBytes(s), recid);
      }
      static fromHex(hex2, format) {
        return this.fromBytes(hexToBytes2(hex2), format);
      }
      assertRecovery() {
        const { recovery } = this;
        if (recovery == null)
          throw new Error("invalid recovery id: must be present");
        return recovery;
      }
      addRecoveryBit(recovery) {
        return new Signature(this.r, this.s, recovery);
      }
      // Unlike the top-level helper below, this method expects a digest that has
      // already been hashed to the curve's message representative.
      recoverPublicKey(messageHash) {
        const { r, s } = this;
        const recovery = this.assertRecovery();
        const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER2 : r;
        if (!Fp.isValid(radj))
          throw new Error("invalid recovery id: sig.r+curve.n != R.x");
        const x = Fp.toBytes(radj);
        const R = Point4.fromBytes(concatBytes2(pprefix((recovery & 1) === 0), x));
        const ir = Fn3.inv(radj);
        const h = bits2int_modN(abytes2(messageHash, void 0, "msgHash"));
        const u1 = Fn3.create(-h * ir);
        const u2 = Fn3.create(s * ir);
        const Q = Point4.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
        if (Q.is0())
          throw new Error("invalid recovery: point at infinify");
        Q.assertValidity();
        return Q;
      }
      // Signatures should be low-s, to prevent malleability.
      hasHighS() {
        return isBiggerThanHalfOrder(this.s);
      }
      toBytes(format = defaultSigOpts.format) {
        validateSigFormat(format);
        if (format === "der")
          return hexToBytes2(DER.hexFromSig(this));
        const { r, s } = this;
        const rb = Fn3.toBytes(r);
        const sb = Fn3.toBytes(s);
        if (format === "recovered") {
          assertRecoverableCurve();
          return concatBytes2(Uint8Array.of(this.assertRecovery()), rb, sb);
        }
        return concatBytes2(rb, sb);
      }
      toHex(format) {
        return bytesToHex2(this.toBytes(format));
      }
    }
    Object.freeze(Signature.prototype);
    Object.freeze(Signature);
    const bits2int = ecdsaOpts.bits2int === void 0 ? function bits2int_def(bytes) {
      if (bytes.length > 8192)
        throw new Error("input is too large");
      const num2 = bytesToNumberBE(bytes);
      const delta = bytes.length * 8 - fnBits;
      return delta > 0 ? num2 >> BigInt(delta) : num2;
    } : ecdsaOpts.bits2int;
    const bits2int_modN = ecdsaOpts.bits2int_modN === void 0 ? function bits2int_modN_def(bytes) {
      return Fn3.create(bits2int(bytes));
    } : ecdsaOpts.bits2int_modN;
    const ORDER_MASK = bitMask(fnBits);
    function int2octets(num2) {
      aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
      return Fn3.toBytes(num2);
    }
    function validateMsgAndHash(message, prehash) {
      abytes2(message, void 0, "message");
      return prehash ? abytes2(hash_(message), void 0, "prehashed message") : message;
    }
    function prepSig(message, secretKey, opts) {
      const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
      message = validateMsgAndHash(message, prehash);
      const h1int = bits2int_modN(message);
      const d = Fn3.fromBytes(secretKey);
      if (!Fn3.isValidNot0(d))
        throw new Error("invalid private key");
      const seedArgs = [int2octets(d), int2octets(h1int)];
      if (extraEntropy != null && extraEntropy !== false) {
        const e = extraEntropy === true ? randomBytes3(lengths.secretKey) : extraEntropy;
        seedArgs.push(abytes2(e, void 0, "extraEntropy"));
      }
      const seed = concatBytes2(...seedArgs);
      const m = h1int;
      function k2sig(kBytes) {
        const k = bits2int(kBytes);
        if (!Fn3.isValidNot0(k))
          return;
        const ik = Fn3.inv(k);
        const q = Point4.BASE.multiply(k).toAffine();
        const r = Fn3.create(q.x);
        if (r === _0n4)
          return;
        const s = Fn3.create(ik * Fn3.create(m + r * d));
        if (s === _0n4)
          return;
        let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
        let normS = s;
        if (lowS && isBiggerThanHalfOrder(s)) {
          normS = Fn3.neg(s);
          recovery ^= 1;
        }
        return new Signature(r, normS, hasLargeRecoveryLifts ? void 0 : recovery);
      }
      return { seed, k2sig };
    }
    function sign(message, secretKey, opts = {}) {
      const { seed, k2sig } = prepSig(message, secretKey, opts);
      const drbg = createHmacDrbg(hash_.outputLen, Fn3.BYTES, hmac2);
      const sig = drbg(seed, k2sig);
      return sig.toBytes(opts.format);
    }
    function verify(signature, message, publicKey, opts = {}) {
      const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
      publicKey = abytes2(publicKey, void 0, "publicKey");
      message = validateMsgAndHash(message, prehash);
      if (!isBytes2(signature)) {
        const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
        throw new Error("verify expects Uint8Array signature" + end);
      }
      validateSigLength(signature, format);
      try {
        const sig = Signature.fromBytes(signature, format);
        const P = Point4.fromBytes(publicKey);
        if (lowS && sig.hasHighS())
          return false;
        const { r, s } = sig;
        const h = bits2int_modN(message);
        const is = Fn3.inv(s);
        const u1 = Fn3.create(h * is);
        const u2 = Fn3.create(r * is);
        const R = Point4.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
        if (R.is0())
          return false;
        const v = Fn3.create(R.x);
        return v === r;
      } catch (e) {
        return false;
      }
    }
    function recoverPublicKey(signature, message, opts = {}) {
      const { prehash } = validateSigOpts(opts, defaultSigOpts);
      message = validateMsgAndHash(message, prehash);
      return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
    }
    return Object.freeze({
      keygen,
      getPublicKey,
      getSharedSecret,
      utils: utils2,
      lengths,
      Point: Point4,
      sign,
      verify,
      recoverPublicKey,
      Signature,
      hash: hash_
    });
  }

  // node_modules/@noble/curves/secp256k1.js
  var secp256k1_CURVE = {
    p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
    n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
    h: BigInt(1),
    a: BigInt(0),
    b: BigInt(7),
    Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
    Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
  };
  var secp256k1_ENDO = {
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    basises: [
      [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
      [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
    ]
  };
  var _0n5 = /* @__PURE__ */ BigInt(0);
  var _2n3 = /* @__PURE__ */ BigInt(2);
  function sqrtMod(y) {
    const P = secp256k1_CURVE.p;
    const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = y * y * y % P;
    const b3 = b2 * b2 * y % P;
    const b6 = pow2(b3, _3n3, P) * b3 % P;
    const b9 = pow2(b6, _3n3, P) * b3 % P;
    const b11 = pow2(b9, _2n3, P) * b2 % P;
    const b22 = pow2(b11, _11n, P) * b11 % P;
    const b44 = pow2(b22, _22n, P) * b22 % P;
    const b88 = pow2(b44, _44n, P) * b44 % P;
    const b176 = pow2(b88, _88n, P) * b88 % P;
    const b220 = pow2(b176, _44n, P) * b44 % P;
    const b223 = pow2(b220, _3n3, P) * b3 % P;
    const t1 = pow2(b223, _23n, P) * b22 % P;
    const t2 = pow2(t1, _6n, P) * b2 % P;
    const root = pow2(t2, _2n3, P);
    if (!Fpk1.eql(Fpk1.sqr(root), y))
      throw new Error("Cannot find square root");
    return root;
  }
  var Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
  var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
    Fp: Fpk1,
    endo: secp256k1_ENDO
  });
  var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);
  var TAGGED_HASH_PREFIXES = {};
  function taggedHash(tag, ...messages) {
    let tagP = TAGGED_HASH_PREFIXES[tag];
    if (tagP === void 0) {
      const tagH = sha256(asciiToBytes(tag));
      tagP = concatBytes2(tagH, tagH);
      TAGGED_HASH_PREFIXES[tag] = tagP;
    }
    return sha256(concatBytes2(tagP, ...messages));
  }
  var pointToBytes = (point) => point.toBytes(true).slice(1);
  var hasEven = (y) => y % _2n3 === _0n5;
  function schnorrGetExtPubKey(priv) {
    const { Fn: Fn3, BASE } = Pointk1;
    const d_ = Fn3.fromBytes(priv);
    const p = BASE.multiply(d_);
    const scalar = hasEven(p.y) ? d_ : Fn3.neg(d_);
    return { scalar, bytes: pointToBytes(p) };
  }
  function lift_x(x) {
    const Fp = Fpk1;
    if (!Fp.isValidNot0(x))
      throw new Error("invalid x: Fail if x \u2265 p");
    const xx = Fp.create(x * x);
    const c = Fp.create(xx * x + BigInt(7));
    let y = Fp.sqrt(c);
    if (!hasEven(y))
      y = Fp.neg(y);
    const p = Pointk1.fromAffine({ x, y });
    p.assertValidity();
    return p;
  }
  var num = bytesToNumberBE;
  function challenge(...args) {
    return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
  }
  function schnorrGetPublicKey(secretKey) {
    return schnorrGetExtPubKey(secretKey).bytes;
  }
  function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
    const { Fn: Fn3, BASE } = Pointk1;
    const m = abytes2(message, void 0, "message");
    const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
    const a = abytes2(auxRand, 32, "auxRand");
    const t = Fn3.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
    const rand = taggedHash("BIP0340/nonce", t, px, m);
    const k_ = Fn3.create(num(rand));
    if (k_ === 0n)
      throw new Error("sign failed: k is zero");
    const p = BASE.multiply(k_);
    const k = hasEven(p.y) ? k_ : Fn3.neg(k_);
    const rx = pointToBytes(p);
    const e = challenge(rx, px, m);
    const sig = new Uint8Array(64);
    sig.set(rx, 0);
    sig.set(Fn3.toBytes(Fn3.create(k + e * d)), 32);
    if (!schnorrVerify(sig, m, px))
      throw new Error("sign: Invalid signature produced");
    return sig;
  }
  function schnorrVerify(signature, message, publicKey) {
    const { Fp, Fn: Fn3, BASE } = Pointk1;
    const sig = abytes2(signature, 64, "signature");
    const m = abytes2(message, void 0, "message");
    const pub = abytes2(publicKey, 32, "publicKey");
    try {
      const P = lift_x(num(pub));
      const r = num(sig.subarray(0, 32));
      if (!Fp.isValidNot0(r))
        return false;
      const s = num(sig.subarray(32, 64));
      if (!Fn3.isValidNot0(s))
        return false;
      const e = challenge(Fn3.toBytes(r), pointToBytes(P), m);
      const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn3.neg(e)));
      const { x, y } = R.toAffine();
      if (R.is0() || !hasEven(y) || x !== r)
        return false;
      return true;
    } catch (error) {
      return false;
    }
  }
  var schnorr = /* @__PURE__ */ (() => {
    const size = 32;
    const seedLength = 48;
    const randomSecretKey = (seed) => {
      seed = seed === void 0 ? randomBytes(seedLength) : seed;
      return mapHashToField(seed, secp256k1_CURVE.n);
    };
    return Object.freeze({
      keygen: createKeygen(randomSecretKey, schnorrGetPublicKey),
      getPublicKey: schnorrGetPublicKey,
      sign: schnorrSign,
      verify: schnorrVerify,
      Point: Pointk1,
      utils: Object.freeze({
        randomSecretKey,
        taggedHash,
        lift_x,
        pointToBytes
      }),
      lengths: Object.freeze({
        secretKey: size,
        publicKey: size,
        publicKeyHasPrefix: false,
        signature: size * 2,
        seed: seedLength
      })
    });
  })();

  // node_modules/@noble/hashes/hkdf.js
  function extract(hash, ikm, salt) {
    ahash(hash);
    if (salt === void 0)
      salt = new Uint8Array(hash.outputLen);
    return hmac(hash, salt, ikm);
  }
  var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
  var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
  function expand(hash, prk, info, length = 32) {
    ahash(hash);
    anumber(length, "length");
    abytes(prk, void 0, "prk");
    const olen = hash.outputLen;
    if (prk.length < olen)
      throw new Error('"prk" must be at least HashLen octets');
    if (length > 255 * olen)
      throw new Error("Length must be <= 255*HashLen");
    const blocks = Math.ceil(length / olen);
    if (info === void 0)
      info = EMPTY_BUFFER;
    else
      abytes(info, void 0, "info");
    const okm = new Uint8Array(blocks * olen);
    const HMAC = hmac.create(hash, prk);
    const HMACTmp = HMAC._cloneInto();
    const T = new Uint8Array(HMAC.outputLen);
    for (let counter = 0; counter < blocks; counter++) {
      HKDF_COUNTER[0] = counter + 1;
      HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
      okm.set(T, olen * counter);
      HMAC._cloneInto(HMACTmp);
    }
    HMAC.destroy();
    HMACTmp.destroy();
    clean(T, HKDF_COUNTER);
    return okm.slice(0, length);
  }
  var hkdf = (hash, ikm, salt, info, length) => expand(hash, extract(hash, ikm, salt), info, length);

  // node_modules/@noble/hashes/sha3.js
  var _0n6 = BigInt(0);
  var _1n5 = BigInt(1);
  var _2n4 = BigInt(2);
  var _7n2 = BigInt(7);
  var _256n = BigInt(256);
  var _0x71n = BigInt(113);
  var SHA3_PI = [];
  var SHA3_ROTL = [];
  var _SHA3_IOTA = [];
  for (let round = 0, R = _1n5, x = 1, y = 0; round < 24; round++) {
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
    let t = _0n6;
    for (let j = 0; j < 7; j++) {
      R = (R << _1n5 ^ (R >> _7n2) * _0x71n) % _256n;
      if (R & _2n4)
        t ^= _1n5 << (_1n5 << BigInt(j)) - _1n5;
    }
    _SHA3_IOTA.push(t);
  }
  var IOTAS = split(_SHA3_IOTA, true);
  var SHA3_IOTA_H = IOTAS[0];
  var SHA3_IOTA_L = IOTAS[1];
  var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
  var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
  function keccakP(s, rounds = 24) {
    anumber(rounds, "rounds");
    if (rounds < 1 || rounds > 24)
      throw new Error('"rounds" expected integer 1..24');
    const B = new Uint32Array(5 * 2);
    for (let round = 24 - rounds; round < 24; round++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL[t];
        const Th = rotlH(curH, curL, shift);
        const Tl = rotlL(curH, curL, shift);
        const PI = SHA3_PI[t];
        curH = s[PI];
        curL = s[PI + 1];
        s[PI] = Th;
        s[PI + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
        s[y] ^= ~s[y + 2] & s[y + 4];
        s[y + 1] ^= ~s[y + 3] & s[y + 5];
        s[y + 2] ^= ~s[y + 4] & s[y + 6];
        s[y + 3] ^= ~s[y + 5] & s[y + 7];
        s[y + 4] ^= ~s[y + 6] & s[y + 8];
        s[y + 5] ^= ~s[y + 7] & s[y + 9];
        s[y + 6] ^= ~s[y + 8] & b0;
        s[y + 7] ^= ~s[y + 9] & b1;
        s[y + 8] ^= ~b0 & b2;
        s[y + 9] ^= ~b1 & b3;
      }
      s[0] ^= SHA3_IOTA_H[round];
      s[1] ^= SHA3_IOTA_L[round];
    }
    clean(B);
  }
  var Keccak = class _Keccak {
    state;
    pos = 0;
    posOut = 0;
    finished = false;
    state32;
    destroyed = false;
    blockLen;
    suffix;
    outputLen;
    canXOF;
    enableXOF = false;
    rounds;
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
      this.blockLen = blockLen;
      this.suffix = suffix;
      this.outputLen = outputLen;
      this.enableXOF = enableXOF;
      this.canXOF = enableXOF;
      this.rounds = rounds;
      anumber(outputLen, "outputLen");
      if (!(0 < blockLen && blockLen < 200))
        throw new Error("only keccak-f1600 function is supported");
      this.state = new Uint8Array(200);
      this.state32 = u32(this.state);
    }
    clone() {
      return this._cloneInto();
    }
    keccak() {
      swap32IfBE(this.state32);
      keccakP(this.state32, this.rounds);
      swap32IfBE(this.state32);
      this.posOut = 0;
      this.pos = 0;
    }
    update(data) {
      aexists(this);
      abytes(data);
      const { blockLen, state } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        for (let i = 0; i < take; i++)
          state[this.pos++] ^= data[pos++];
        if (this.pos === blockLen)
          this.keccak();
      }
      return this;
    }
    finish() {
      if (this.finished)
        return;
      this.finished = true;
      const { state, suffix, pos, blockLen } = this;
      state[pos] ^= suffix;
      if ((suffix & 128) !== 0 && pos === blockLen - 1)
        this.keccak();
      state[blockLen - 1] ^= 128;
      this.keccak();
    }
    writeInto(out) {
      aexists(this, false);
      abytes(out);
      this.finish();
      const bufferOut = this.state;
      const { blockLen } = this;
      for (let pos = 0, len = out.length; pos < len; ) {
        if (this.posOut >= blockLen)
          this.keccak();
        const take = Math.min(blockLen - this.posOut, len - pos);
        out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
        this.posOut += take;
        pos += take;
      }
      return out;
    }
    xofInto(out) {
      if (!this.enableXOF)
        throw new Error("XOF is not possible for this instance");
      return this.writeInto(out);
    }
    xof(bytes) {
      anumber(bytes);
      return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
      aoutput(out, this);
      if (this.finished)
        throw new Error("digest() was already called");
      this.writeInto(out.subarray(0, this.outputLen));
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.outputLen);
      this.digestInto(out);
      return out;
    }
    destroy() {
      this.destroyed = true;
      clean(this.state);
    }
    _cloneInto(to) {
      const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
      to ||= new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
      to.blockLen = blockLen;
      to.state32.set(this.state32);
      to.pos = this.pos;
      to.posOut = this.posOut;
      to.finished = this.finished;
      to.rounds = rounds;
      to.suffix = suffix;
      to.outputLen = outputLen;
      to.enableXOF = enableXOF;
      to.canXOF = this.canXOF;
      to.destroyed = this.destroyed;
      return to;
    }
  };
  var genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
  var keccak_256 = /* @__PURE__ */ genKeccak(1, 136, 32);

  // node_modules/@noble/hashes/legacy.js
  var Rho160 = /* @__PURE__ */ Uint8Array.from([
    7,
    4,
    13,
    1,
    10,
    6,
    15,
    3,
    12,
    0,
    9,
    5,
    2,
    14,
    11,
    8
  ]);
  var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
  var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
  var idxLR = /* @__PURE__ */ (() => {
    const L = [Id160];
    const R = [Pi160];
    const res = [L, R];
    for (let i = 0; i < 4; i++)
      for (let j of res)
        j.push(j[i].map((k) => Rho160[k]));
    return res;
  })();
  var idxL = /* @__PURE__ */ (() => idxLR[0])();
  var idxR = /* @__PURE__ */ (() => idxLR[1])();
  var shifts160 = /* @__PURE__ */ [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
  ].map((i) => Uint8Array.from(i));
  var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var Kl160 = /* @__PURE__ */ Uint32Array.from([
    0,
    1518500249,
    1859775393,
    2400959708,
    2840853838
  ]);
  var Kr160 = /* @__PURE__ */ Uint32Array.from([
    1352829926,
    1548603684,
    1836072691,
    2053994217,
    0
  ]);
  function ripemd_f(group, x, y, z) {
    if (group === 0)
      return x ^ y ^ z;
    if (group === 1)
      return x & y | ~x & z;
    if (group === 2)
      return (x | ~y) ^ z;
    if (group === 3)
      return x & z | y & ~z;
    return x ^ (y | ~z);
  }
  var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
  var _RIPEMD160 = class extends HashMD {
    h0 = 1732584193 | 0;
    h1 = 4023233417 | 0;
    h2 = 2562383102 | 0;
    h3 = 271733878 | 0;
    h4 = 3285377520 | 0;
    constructor() {
      super(64, 20, 8, true);
    }
    get() {
      const { h0, h1, h2, h3, h4 } = this;
      return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
      this.h0 = h0 | 0;
      this.h1 = h1 | 0;
      this.h2 = h2 | 0;
      this.h3 = h3 | 0;
      this.h4 = h4 | 0;
    }
    process(view2, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        BUF_160[i] = view2.getUint32(offset, true);
      let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
      for (let group = 0; group < 5; group++) {
        const rGroup = 4 - group;
        const hbl = Kl160[group], hbr = Kr160[group];
        const rl = idxL[group], rr = idxR[group];
        const sl = shiftsL160[group], sr = shiftsR160[group];
        for (let i = 0; i < 16; i++) {
          const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
          al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
        }
        for (let i = 0; i < 16; i++) {
          const tr = rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
          ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
        }
      }
      this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
    }
    roundClean() {
      clean(BUF_160);
    }
    destroy() {
      this.destroyed = true;
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0);
    }
  };
  var ripemd160 = /* @__PURE__ */ createHasher(() => new _RIPEMD160());

  // node_modules/@scure/base/index.js
  function isBytes3(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function abytes3(b) {
    if (!isBytes3(b))
      throw new TypeError("Uint8Array expected");
  }
  function isArrayOf(isString, arr) {
    if (!Array.isArray(arr))
      return false;
    if (arr.length === 0)
      return true;
    if (isString) {
      return arr.every((item) => typeof item === "string");
    } else {
      return arr.every((item) => Number.isSafeInteger(item));
    }
  }
  function afn(input) {
    if (typeof input !== "function")
      throw new TypeError("function expected");
    return true;
  }
  function astr(label, input) {
    if (typeof input !== "string")
      throw new TypeError(`${label}: string expected`);
    return true;
  }
  function anumber3(n) {
    if (typeof n !== "number")
      throw new TypeError(`number expected, got ${typeof n}`);
    if (!Number.isSafeInteger(n))
      throw new RangeError(`invalid integer: ${n}`);
  }
  function aArr(input) {
    if (!Array.isArray(input))
      throw new TypeError("array expected");
  }
  function astrArr(label, input) {
    if (!isArrayOf(true, input))
      throw new TypeError(`${label}: array of strings expected`);
  }
  function anumArr(label, input) {
    if (!isArrayOf(false, input))
      throw new TypeError(`${label}: array of numbers expected`);
  }
  // @__NO_SIDE_EFFECTS__
  function chain(...args) {
    const id = (a) => a;
    const wrap2 = (a, b) => (c) => a(b(c));
    const encode = args.map((x) => x.encode).reduceRight(wrap2, id);
    const decode = args.map((x) => x.decode).reduce(wrap2, id);
    return { encode, decode };
  }
  // @__NO_SIDE_EFFECTS__
  function alphabet(letters) {
    const lettersA = typeof letters === "string" ? letters.split("") : letters;
    const len = lettersA.length;
    astrArr("alphabet", lettersA);
    const indexes = new Map(lettersA.map((l, i) => [l, i]));
    return {
      encode: (digits) => {
        aArr(digits);
        return digits.map((i) => {
          if (!Number.isSafeInteger(i) || i < 0 || i >= len)
            throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
          return lettersA[i];
        });
      },
      decode: (input) => {
        aArr(input);
        return input.map((letter) => {
          astr("alphabet.decode", letter);
          const i = indexes.get(letter);
          if (i === void 0)
            throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
          return i;
        });
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function join(separator = "") {
    astr("join", separator);
    return {
      encode: (from) => {
        astrArr("join.decode", from);
        return from.join(separator);
      },
      decode: (to) => {
        astr("join.decode", to);
        return to.split(separator);
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function normalize(fn) {
    afn(fn);
    return { encode: (from) => from, decode: (to) => fn(to) };
  }
  function convertRadix(data, from, to) {
    if (from < 2)
      throw new RangeError(`convertRadix: invalid from=${from}, base cannot be less than 2`);
    if (to < 2)
      throw new RangeError(`convertRadix: invalid to=${to}, base cannot be less than 2`);
    aArr(data);
    if (!data.length)
      return [];
    let pos = 0;
    const res = [];
    const digits = Array.from(data, (d) => {
      anumber3(d);
      if (d < 0 || d >= from)
        throw new Error(`invalid integer: ${d}`);
      return d;
    });
    const dlen = digits.length;
    while (true) {
      let carry = 0;
      let done = true;
      for (let i = pos; i < dlen; i++) {
        const digit = digits[i];
        const fromCarry = from * carry;
        const digitBase = fromCarry + digit;
        if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
          throw new Error("convertRadix: carry overflow");
        }
        const div = digitBase / to;
        carry = digitBase % to;
        const rounded = Math.floor(div);
        digits[i] = rounded;
        if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
          throw new Error("convertRadix: carry overflow");
        if (!done)
          continue;
        else if (!rounded)
          pos = i;
        else
          done = false;
      }
      res.push(carry);
      if (done)
        break;
    }
    for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
      res.push(0);
    return res.reverse();
  }
  var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
  var powers = /* @__PURE__ */ (() => {
    let res = [];
    for (let i = 0; i < 40; i++)
      res.push(2 ** i);
    return res;
  })();
  function convertRadix2(data, from, to, padding) {
    aArr(data);
    if (from <= 0 || from > 32)
      throw new RangeError(`convertRadix2: wrong from=${from}`);
    if (to <= 0 || to > 32)
      throw new RangeError(`convertRadix2: wrong to=${to}`);
    if (/* @__PURE__ */ radix2carry(from, to) > 32) {
      throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
    }
    let carry = 0;
    let pos = 0;
    const max = powers[from];
    const mask = powers[to] - 1;
    const res = [];
    for (const n of data) {
      anumber3(n);
      if (n >= max)
        throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
      carry = carry << from | n;
      if (pos + from > 32)
        throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
      pos += from;
      for (; pos >= to; pos -= to)
        res.push((carry >> pos - to & mask) >>> 0);
      const pow = powers[pos];
      if (pow === void 0)
        throw new Error("invalid carry");
      carry &= pow - 1;
    }
    carry = carry << to - pos & mask;
    if (!padding && pos >= from)
      throw new Error("Excess padding");
    if (!padding && carry > 0)
      throw new Error(`Non-zero padding: ${carry}`);
    if (padding && pos > 0)
      res.push(carry >>> 0);
    return res;
  }
  // @__NO_SIDE_EFFECTS__
  function radix(num2) {
    anumber3(num2);
    const _256 = 2 ** 8;
    return {
      encode: (bytes) => {
        if (!isBytes3(bytes))
          throw new TypeError("radix.encode input should be Uint8Array");
        return convertRadix(Array.from(bytes), _256, num2);
      },
      decode: (digits) => {
        anumArr("radix.decode", digits);
        return Uint8Array.from(convertRadix(digits, num2, _256));
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function radix2(bits, revPadding = false) {
    anumber3(bits);
    if (bits <= 0 || bits > 32)
      throw new RangeError("radix2: bits should be in (0..32]");
    if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
      throw new RangeError("radix2: carry overflow");
    return {
      encode: (bytes) => {
        if (!isBytes3(bytes))
          throw new TypeError("radix2.encode input should be Uint8Array");
        return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
      },
      decode: (digits) => {
        anumArr("radix2.decode", digits);
        return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
      }
    };
  }
  function unsafeWrapper(fn) {
    afn(fn);
    return function(...args) {
      try {
        return fn.apply(null, args);
      } catch (e) {
      }
    };
  }
  function checksum(len, fn) {
    anumber3(len);
    if (len <= 0)
      throw new RangeError(`checksum length must be positive: ${len}`);
    afn(fn);
    const _fn = fn;
    return {
      encode(data) {
        if (!isBytes3(data))
          throw new TypeError("checksum.encode: input should be Uint8Array");
        const sum = _fn(data).slice(0, len);
        const res = new Uint8Array(data.length + len);
        res.set(data);
        res.set(sum, data.length);
        return res;
      },
      decode(data) {
        if (!isBytes3(data))
          throw new TypeError("checksum.decode: input should be Uint8Array");
        const payload = data.slice(0, -len);
        const oldChecksum = data.slice(-len);
        const newChecksum = _fn(payload).slice(0, len);
        for (let i = 0; i < len; i++)
          if (newChecksum[i] !== oldChecksum[i])
            throw new Error("Invalid checksum");
        return payload;
      }
    };
  }
  var genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet(abc), /* @__PURE__ */ join(""));
  var base58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"));
  var createBase58check = (sha2563) => {
    afn(sha2563);
    const _sha256 = sha2563;
    return /* @__PURE__ */ chain(checksum(4, (data) => _sha256(_sha256(data))), base58);
  };
  var BECH_ALPHABET = /* @__PURE__ */ chain(/* @__PURE__ */ alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join(""));
  var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
  function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 33554431) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
      if ((b >> i & 1) === 1)
        chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
  }
  function bechChecksum(prefix2, words, encodingConst = 1) {
    const len = prefix2.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
      const c = prefix2.charCodeAt(i);
      if (c < 33 || c > 126)
        throw new Error(`Invalid prefix (${prefix2})`);
      chk = bech32Polymod(chk) ^ c >> 5;
    }
    chk = bech32Polymod(chk);
    for (let i = 0; i < len; i++)
      chk = bech32Polymod(chk) ^ prefix2.charCodeAt(i) & 31;
    for (let v of words)
      chk = bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
      chk = bech32Polymod(chk);
    chk ^= encodingConst;
    return BECH_ALPHABET.encode(convertRadix2([chk % powers[30]], 30, 5, false));
  }
  // @__NO_SIDE_EFFECTS__
  function genBech32(encoding) {
    const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
    const _words = /* @__PURE__ */ radix2(5);
    const fromWords = _words.decode;
    const toWords = _words.encode;
    const fromWordsUnsafe = unsafeWrapper(fromWords);
    function encode(prefix2, words, limit = 90) {
      astr("bech32.encode prefix", prefix2);
      if (isBytes3(words))
        words = Array.from(words);
      anumArr("bech32.encode", words);
      const plen = prefix2.length;
      if (plen === 0)
        throw new TypeError(`Invalid prefix length ${plen}`);
      const actualLength = plen + 7 + words.length;
      if (limit !== false && actualLength > limit)
        throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
      const lowered = prefix2.toLowerCase();
      const sum = bechChecksum(lowered, words, ENCODING_CONST);
      return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
    }
    function decode(str, limit = 90) {
      astr("bech32.decode input", str);
      const slen = str.length;
      if (slen < 8 || limit !== false && slen > limit)
        throw new TypeError(`invalid string length: ${slen} (${str}). Expected (8..${limit})`);
      const lowered = str.toLowerCase();
      if (str !== lowered && str !== str.toUpperCase())
        throw new Error(`String must be lowercase or uppercase`);
      const sepIndex = lowered.lastIndexOf("1");
      if (sepIndex === 0 || sepIndex === -1)
        throw new Error(`Letter "1" must be present between prefix and data only`);
      const prefix2 = lowered.slice(0, sepIndex);
      const data = lowered.slice(sepIndex + 1);
      if (data.length < 6)
        throw new Error("Data must be at least 6 characters long");
      const words = BECH_ALPHABET.decode(data).slice(0, -6);
      const sum = bechChecksum(prefix2, words, ENCODING_CONST);
      if (!data.endsWith(sum))
        throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
      return { prefix: prefix2, words };
    }
    const decodeUnsafe = unsafeWrapper(decode);
    function decodeToBytes(str) {
      const { prefix: prefix2, words } = decode(str, false);
      return {
        prefix: prefix2,
        words,
        bytes: fromWords(words)
      };
    }
    function encodeFromBytes(prefix2, bytes) {
      return encode(prefix2, toWords(bytes));
    }
    return {
      encode,
      decode,
      encodeFromBytes,
      decodeToBytes,
      decodeUnsafe,
      fromWords,
      fromWordsUnsafe,
      toWords
    };
  }
  var bech32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32"));
  var bech32m = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBech32("bech32m"));
  var hasHexBuiltin2 = /* @__PURE__ */ (() => (
    // Require both directions before enabling the native hex path so encode/decode stay symmetric.
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
  ))();
  var hexBuiltin = {
    // Keep local type guards so the native path preserves library-level input errors.
    // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
    encode(data) {
      abytes3(data);
      return data.toHex();
    },
    // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
    decode(s) {
      astr("hex", s);
      return Uint8Array.fromHex(s);
    }
  };
  var hex = /* @__PURE__ */ Object.freeze(hasHexBuiltin2 ? hexBuiltin : /* @__PURE__ */ chain(/* @__PURE__ */ radix2(4), /* @__PURE__ */ alphabet("0123456789abcdef"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize((s) => {
    if (typeof s !== "string" || s.length % 2 !== 0)
      throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
    return s.toLowerCase();
  })));

  // node_modules/@scure/bip32/index.js
  var Point = /* @__PURE__ */ (() => secp256k1.Point)();
  var Fn = /* @__PURE__ */ (() => Point.Fn)();
  var base58check = /* @__PURE__ */ createBase58check(sha256);
  var MASTER_SECRET = /* @__PURE__ */ (() => {
    return Uint8Array.from("Bitcoin seed".split(""), (char) => char.charCodeAt(0));
  })();
  var BITCOIN_VERSIONS = { private: 76066276, public: 76067358 };
  var HARDENED_OFFSET = 2147483648;
  var hash160 = (data) => ripemd160(sha256(data));
  var fromU32 = (data) => createView(data).getUint32(0, false);
  var toU32 = (n) => {
    if (typeof n !== "number")
      throw new TypeError("invalid number, should be from 0 to 2**32-1, got " + n);
    if (!Number.isSafeInteger(n) || n < 0 || n > 2 ** 32 - 1)
      throw new RangeError("invalid number, should be from 0 to 2**32-1, got " + n);
    const buf = new Uint8Array(4);
    createView(buf).setUint32(0, n, false);
    return buf;
  };
  var HDKey = class _HDKey {
    get fingerprint() {
      if (!this.pubHash) {
        throw new Error("No publicKey set!");
      }
      return fromU32(this.pubHash);
    }
    get identifier() {
      return this.pubHash;
    }
    get pubKeyHash() {
      return this.pubHash;
    }
    // Returns the live private key buffer for this instance.
    // Copy it first if you need an immutable snapshot.
    get privateKey() {
      return this._privateKey || null;
    }
    get publicKey() {
      return this._publicKey || null;
    }
    get privateExtendedKey() {
      const priv = this._privateKey;
      if (!priv) {
        throw new Error("No private key");
      }
      return base58check.encode(this.serialize(this.versions.private, concatBytes(Uint8Array.of(0), priv)));
    }
    get publicExtendedKey() {
      if (!this._publicKey) {
        throw new Error("No public key");
      }
      return base58check.encode(this.serialize(this.versions.public, this._publicKey));
    }
    static fromMasterSeed(seed, versions = BITCOIN_VERSIONS) {
      abytes(seed);
      if (8 * seed.length < 128 || 8 * seed.length > 512) {
        throw new RangeError("HDKey: seed length must be between 128 and 512 bits; 256 bits is advised, got " + seed.length);
      }
      const I = hmac(sha512, MASTER_SECRET, seed);
      const privateKey = I.slice(0, 32);
      const chainCode = I.slice(32);
      return new _HDKey({ versions, chainCode, privateKey });
    }
    static fromExtendedKey(base58key, versions = BITCOIN_VERSIONS) {
      const keyBuffer = base58check.decode(base58key);
      const keyView = createView(keyBuffer);
      const version = keyView.getUint32(0, false);
      const opt = {
        versions,
        depth: keyBuffer[4],
        parentFingerprint: keyView.getUint32(5, false),
        index: keyView.getUint32(9, false),
        chainCode: keyBuffer.slice(13, 45)
      };
      const key = keyBuffer.slice(45);
      const isPriv = key[0] === 0;
      if (version !== versions[isPriv ? "private" : "public"]) {
        throw new Error("Version mismatch");
      }
      if (isPriv) {
        return new _HDKey({ ...opt, privateKey: key.slice(1) });
      } else {
        return new _HDKey({ ...opt, publicKey: key });
      }
    }
    static fromJSON(json) {
      return _HDKey.fromExtendedKey(json.xpriv);
    }
    versions;
    depth = 0;
    index = 0;
    chainCode = null;
    parentFingerprint = 0;
    _privateKey;
    _publicKey;
    pubHash;
    constructor(opt) {
      if (!opt || typeof opt !== "object") {
        throw new Error("HDKey.constructor must not be called directly");
      }
      this.versions = opt.versions || BITCOIN_VERSIONS;
      this.depth = opt.depth || 0;
      this.chainCode = opt.chainCode ? Uint8Array.from(opt.chainCode) : null;
      this.index = opt.index || 0;
      this.parentFingerprint = opt.parentFingerprint || 0;
      if (!this.depth) {
        if (this.parentFingerprint || this.index) {
          throw new Error("HDKey: zero depth with non-zero index/parent fingerprint");
        }
      }
      if (this.depth > 255) {
        throw new Error("HDKey: depth exceeds the serializable value 255");
      }
      if (opt.publicKey && opt.privateKey) {
        throw new Error("HDKey: publicKey and privateKey at same time.");
      }
      if (opt.privateKey) {
        if (!secp256k1.utils.isValidSecretKey(opt.privateKey))
          throw new Error("Invalid private key");
        this._privateKey = Uint8Array.from(opt.privateKey);
        this._publicKey = secp256k1.getPublicKey(this._privateKey, true);
      } else if (opt.publicKey) {
        this._publicKey = Point.fromBytes(opt.publicKey).toBytes(true);
      } else {
        throw new Error("HDKey: no public or private key provided");
      }
      this.pubHash = hash160(this._publicKey);
    }
    derive(path) {
      if (!/^[mM]'?/.test(path)) {
        throw new Error('Path must start with "m" or "M"');
      }
      if (/^[mM]'?$/.test(path)) {
        return this;
      }
      const parts = path.replace(/^[mM]'?\//, "").split("/");
      let child = this;
      for (const c of parts) {
        const m = /^(\d+)('?)$/.exec(c);
        const m1 = m && m[1];
        if (!m || m.length !== 3 || typeof m1 !== "string")
          throw new Error("invalid child index: " + c);
        let idx = +m1;
        if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET) {
          throw new Error("Invalid index");
        }
        if (m[2] === "'") {
          idx += HARDENED_OFFSET;
        }
        child = child.deriveChild(idx);
      }
      return child;
    }
    /**
     * @param _I - Test-only override for the 64-byte HMAC-SHA512 output; normal callers must omit it.
     */
    deriveChild(index, _I) {
      if (!this._publicKey || !this.chainCode) {
        throw new Error("No publicKey or chainCode set");
      }
      let data = toU32(index);
      if (index >= HARDENED_OFFSET) {
        const priv = this._privateKey;
        if (!priv) {
          throw new Error("Could not derive hardened child key");
        }
        data = concatBytes(Uint8Array.of(0), priv, data);
      } else {
        data = concatBytes(this._publicKey, data);
      }
      const out = _I || hmac(sha512, this.chainCode, data);
      abytes(out, 64);
      const childTweak = out.slice(0, 32);
      const chainCode = out.slice(32);
      const opt = {
        versions: this.versions,
        chainCode,
        depth: this.depth + 1,
        parentFingerprint: this.fingerprint,
        index
      };
      if (opt.depth > 255) {
        throw new Error("HDKey: depth exceeds the serializable value 255");
      }
      try {
        const ctweak = Fn.fromBytes(childTweak);
        if (this._privateKey) {
          const added = Fn.create(Fn.fromBytes(this._privateKey) + ctweak);
          if (!Fn.isValidNot0(added)) {
            throw new Error("The tweak was out of range or the resulted private key is invalid");
          }
          opt.privateKey = Fn.toBytes(added);
        } else {
          const point = Point.fromBytes(this._publicKey);
          const added = ctweak === 0n ? point : point.add(Point.BASE.multiply(ctweak));
          if (added.equals(Point.ZERO)) {
            throw new Error("The tweak was equal to negative P, which made the result key invalid");
          }
          opt.publicKey = added.toBytes(true);
        }
        return new _HDKey(opt);
      } catch (err) {
        return this.deriveChild(index + 1);
      }
    }
    sign(hash) {
      if (!this._privateKey) {
        throw new Error("No privateKey set!");
      }
      abytes(hash, 32);
      return secp256k1.sign(hash, this._privateKey, { prehash: false });
    }
    verify(hash, signature) {
      abytes(hash, 32);
      abytes(signature, 64);
      if (!this._publicKey) {
        throw new Error("No publicKey set!");
      }
      return secp256k1.verify(signature, hash, this._publicKey, { prehash: false });
    }
    wipePrivateData() {
      if (this._privateKey) {
        this._privateKey.fill(0);
        this._privateKey = void 0;
      }
      return this;
    }
    toJSON() {
      return {
        xpriv: this.privateExtendedKey,
        xpub: this.publicExtendedKey
      };
    }
    serialize(version, key) {
      if (!this.chainCode) {
        throw new Error("No chainCode set");
      }
      abytes(key, 33);
      return concatBytes(toU32(version), new Uint8Array([this.depth]), toU32(this.parentFingerprint), toU32(this.index), this.chainCode, key);
    }
  };

  // node_modules/micro-packed/index.js
  var EMPTY = /* @__PURE__ */ Uint8Array.of();
  var restrictedKeys = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
  var validateFieldName = (name, label) => {
    if (typeof name !== "string")
      throw new Error(`${label} should be string, got ${typeof name}`);
    if (name.includes(".."))
      throw new TypeError(`${label} ${name} cannot contain path parent ..`);
    if (name.includes("/"))
      throw new TypeError(`${label} ${name} cannot contain path separator /`);
    if (restrictedKeys.has(name))
      throw new Error(`${label} ${name} is reserved`);
  };
  function equalBytes2(a, b) {
    if (a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (a[i] !== b[i])
        return false;
    return true;
  }
  function createFindBytes(needle) {
    if (needle.length === 1) {
      const byte = needle[0];
      return (data, pos = 0) => {
        const idx = data.indexOf(byte, pos);
        return idx === -1 ? void 0 : idx;
      };
    }
    const back = new Uint32Array(needle.length);
    for (let i = 1, j = 0; i < needle.length; i++) {
      while (j && needle[i] !== needle[j])
        j = back[j - 1];
      if (needle[i] === needle[j])
        back[i] = ++j;
    }
    return (data, pos = 0) => {
      for (let i = pos, j = 0; i < data.length; i++) {
        while (j && data[i] !== needle[j])
          j = back[j - 1];
        if (data[i] !== needle[j])
          continue;
        if (++j === needle.length)
          return i - needle.length + 1;
      }
      return void 0;
    };
  }
  var findBytes = (needle, data, pos = 0) => createFindBytes(needle)(data, pos);
  function isBytes4(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function concatBytes3(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      if (!isBytes4(a))
        throw new Error("Uint8Array expected");
      sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad);
      pad += a.length;
    }
    return res;
  }
  var createView2 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var _0n7 = /* @__PURE__ */ BigInt(0);
  var _1n6 = /* @__PURE__ */ BigInt(1);
  var _2n5 = /* @__PURE__ */ BigInt(2);
  var _10n = /* @__PURE__ */ BigInt(10);
  function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  function isNum(num2) {
    return Number.isSafeInteger(num2);
  }
  var hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  var utils = /* @__PURE__ */ Object.freeze({
    equalBytes: equalBytes2,
    isBytes: isBytes4,
    isCoder,
    checkBounds,
    concatBytes: concatBytes3,
    createView: createView2,
    isPlainObject
  });
  var lengthCoder = (len) => {
    if (len !== null && typeof len !== "string" && !isCoder(len) && !isBytes4(len) && !isNum(len)) {
      throw new TypeError(`lengthCoder: expected null | number | Uint8Array | CoderType, got ${len} (${typeof len})`);
    }
    if (typeof len === "number" && len < 0)
      throw new Error(`lengthCoder: wrong length=${len}`);
    if (isBytes4(len) && !len.length)
      throw new Error("lengthCoder: empty terminator");
    return {
      encodeStream(w, value) {
        if (len === null)
          return;
        if (isCoder(len))
          return len.encodeStream(w, value);
        let byteLen;
        if (typeof len === "number")
          byteLen = len;
        else if (typeof len === "string")
          byteLen = Path.resolve(w.stack, len);
        if (typeof byteLen === "bigint")
          byteLen = Number(byteLen);
        if (byteLen === void 0 || byteLen !== value)
          throw w.err(`Wrong length: ${byteLen} len=${len} exp=${value} (${typeof value})`);
      },
      decodeStream(r) {
        let byteLen;
        if (isCoder(len))
          byteLen = Number(len.decodeStream(r));
        else if (typeof len === "number")
          byteLen = len;
        else if (typeof len === "string")
          byteLen = Path.resolve(r.stack, len);
        if (typeof byteLen === "bigint")
          byteLen = Number(byteLen);
        if (!isNum(byteLen) || byteLen < 0)
          throw r.err(`Wrong length: ${byteLen}`);
        return byteLen;
      }
    };
  };
  var Bitset = /* @__PURE__ */ Object.freeze({
    BITS: 32,
    FULL_MASK: -1 >>> 0,
    // 1<<32 will overflow
    len: (len) => {
      if (!isNum(len) || len < 0)
        throw new Error(`wrong len=${len}`);
      return Math.ceil(len / 32);
    },
    create: (len) => new Uint32Array(Bitset.len(len)),
    clean: (bs) => bs.fill(0),
    debug: (bs) => Array.from(bs).map((i) => (i >>> 0).toString(2).padStart(32, "0")),
    checkLen: (bs, len) => {
      if (Bitset.len(len) === bs.length)
        return;
      throw new Error(`wrong length=${bs.length}. Expected: ${Bitset.len(len)}`);
    },
    chunkLen: (bsLen, pos, len) => {
      if (!isNum(bsLen) || bsLen < 0)
        throw new Error(`wrong bsLen=${bsLen}`);
      if (!isNum(pos) || pos < 0)
        throw new Error(`wrong pos=${pos}`);
      if (!isNum(len) || len < 0)
        throw new Error(`wrong len=${len}`);
      if (pos > bsLen - len)
        throw new Error(`wrong range=${pos}/${len} of ${bsLen}`);
    },
    set: (bs, chunk, value, allowRewrite = true) => {
      if (!isNum(chunk) || chunk < 0 || chunk >= bs.length)
        return false;
      if (!allowRewrite && (bs[chunk] & value) !== 0)
        return false;
      bs[chunk] |= value;
      return true;
    },
    pos: (pos, i) => ({
      chunk: Math.floor((pos + i) / 32),
      mask: 1 << 32 - (pos + i) % 32 - 1
    }),
    indices: (bs, len, invert2 = false) => {
      Bitset.checkLen(bs, len);
      const { FULL_MASK, BITS } = Bitset;
      const left = BITS - len % BITS;
      const lastMask = left ? FULL_MASK >>> left << left : FULL_MASK;
      const res = [];
      for (let i = 0; i < bs.length; i++) {
        let c = bs[i];
        if (invert2)
          c = ~c;
        if (i === bs.length - 1)
          c &= lastMask;
        if (c === 0)
          continue;
        for (let j = 0; j < BITS; j++) {
          const m = 1 << BITS - j - 1;
          if (c & m)
            res.push(i * BITS + j);
        }
      }
      return res;
    },
    range: (arr) => {
      const res = [];
      let cur;
      for (const i of arr) {
        if (cur === void 0 || i !== cur.pos + cur.length)
          res.push(cur = { pos: i, length: 1 });
        else
          cur.length += 1;
      }
      return res;
    },
    rangeDebug: (bs, len, invert2 = false) => `[${Bitset.range(Bitset.indices(bs, len, invert2)).map((i) => `(${i.pos}/${i.length})`).join(", ")}]`,
    setRange: (bs, bsLen, pos, len, allowRewrite = true) => {
      Bitset.chunkLen(bsLen, pos, len);
      if (len === 0)
        return true;
      const { FULL_MASK, BITS } = Bitset;
      const first = pos % BITS ? Math.floor(pos / BITS) : void 0;
      const lastPos = pos + len;
      const last = lastPos % BITS ? Math.floor(lastPos / BITS) : void 0;
      const canSet = (chunk, value) => chunk >= 0 && chunk < bs.length && (bs[chunk] & value) === 0;
      if (!allowRewrite) {
        if (first !== void 0 && first === last) {
          if (!canSet(first, FULL_MASK >>> BITS - len << BITS - len - pos))
            return false;
        } else {
          if (first !== void 0 && !canSet(first, FULL_MASK >>> pos % BITS))
            return false;
          const start2 = first !== void 0 ? first + 1 : pos / BITS;
          const end2 = last !== void 0 ? last : lastPos / BITS;
          for (let i = start2; i < end2; i++)
            if (!canSet(i, FULL_MASK))
              return false;
          if (last !== void 0 && first !== last) {
            if (!canSet(last, FULL_MASK << BITS - lastPos % BITS))
              return false;
          }
        }
      }
      if (first !== void 0 && first === last)
        return Bitset.set(bs, first, FULL_MASK >>> BITS - len << BITS - len - pos, allowRewrite);
      if (first !== void 0) {
        if (!Bitset.set(bs, first, FULL_MASK >>> pos % BITS, allowRewrite))
          return false;
      }
      const start = first !== void 0 ? first + 1 : pos / BITS;
      const end = last !== void 0 ? last : lastPos / BITS;
      for (let i = start; i < end; i++)
        if (!Bitset.set(bs, i, FULL_MASK, allowRewrite))
          return false;
      if (last !== void 0 && first !== last) {
        if (!Bitset.set(bs, last, FULL_MASK << BITS - lastPos % BITS, allowRewrite))
          return false;
      }
      return true;
    }
  });
  var Path = /* @__PURE__ */ Object.freeze({
    /**
     * Internal method for handling stack of paths (debug, errors, dynamic fields via path)
     * This callback shape forces stack cleanup by construction:
     * `.pop()` always happens after the wrapped function.
     * Also, this makes impossible:
     * - pushing field when stack is empty
     * - pushing field inside of field (real bug)
     * NOTE: we don't want to do '.pop' on error!
     */
    pushObj: (stack, obj, objFn) => {
      const last = { obj };
      stack.push(last);
      objFn((field, fieldFn) => {
        last.field = field;
        fieldFn();
        last.field = void 0;
      });
      stack.pop();
    },
    path: (stack) => {
      const res = [];
      for (const i of stack)
        if (i.field !== void 0)
          res.push(i.field === "" ? '""' : i.field);
      return res.join("/");
    },
    err: (name, stack, msg) => {
      const text = `${name}(${Path.path(stack)}): ${typeof msg === "string" ? msg : msg.message}`;
      const err = msg instanceof TypeError ? new TypeError(text) : msg instanceof RangeError ? new RangeError(text) : new Error(text);
      if (msg instanceof Error && msg.stack) {
        const from = `${msg.name}: ${msg.message}`;
        const to = `${err.name}: ${err.message}`;
        err.stack = msg.stack.startsWith(from) ? `${to}${msg.stack.slice(from.length)}` : msg.stack;
      }
      return err;
    },
    resolve: (stack, path) => {
      const parts = path.split("/");
      const objPath = stack.map((i2) => i2.obj);
      let i = 0;
      for (; i < parts.length; i++) {
        if (parts[i] === "..")
          objPath.pop();
        else
          break;
      }
      let cur = objPath.pop();
      for (; i < parts.length; i++) {
        if (!cur || cur[parts[i]] === void 0)
          return void 0;
        cur = cur[parts[i]];
      }
      return cur;
    }
  });
  var _Reader = class __Reader {
    pos = 0;
    data;
    opts;
    stack;
    parent;
    parentOffset;
    bitBuf = 0;
    bitPos = 0;
    bs;
    // bitset
    view;
    constructor(data, opts = {}, stack = [], parent = void 0, parentOffset = 0) {
      this.data = data;
      this.opts = opts;
      this.stack = stack;
      this.parent = parent;
      this.parentOffset = parentOffset;
      this.view = createView2(data);
    }
    /** Internal method for pointers. */
    _enablePointers() {
      if (this.parent)
        return this.parent._enablePointers();
      if (this.bs)
        return;
      this.bs = Bitset.create(this.data.length);
      Bitset.setRange(this.bs, this.data.length, 0, this.pos, this.opts.allowMultipleReads);
    }
    markBytesBS(pos, len) {
      if (this.parent)
        return this.parent.markBytesBS(this.parentOffset + pos, len);
      if (!len)
        return true;
      if (!this.bs)
        return true;
      return Bitset.setRange(this.bs, this.data.length, pos, len, false);
    }
    markBytes(len) {
      const pos = this.pos;
      const res = this.markBytesBS(pos, len);
      if (!this.opts.allowMultipleReads && !res)
        throw this.err(`multiple read pos=${pos} len=${len}`);
      this.pos += len;
      return res;
    }
    pushObj(obj, objFn) {
      return Path.pushObj(this.stack, obj, objFn);
    }
    readView(n, fn) {
      if (!isNum(n) || n < 0)
        throw this.err(`readView: wrong length=${n}`);
      if (this.pos + n > this.data.length)
        throw this.err("readView: Unexpected end of buffer");
      const res = fn(this.view, this.pos);
      this.markBytes(n);
      return res;
    }
    // read bytes by absolute offset
    absBytes(n) {
      if (!isNum(n) || n < 0 || n > this.data.length)
        throw new Error("Unexpected end of buffer");
      return this.data.subarray(n);
    }
    finish() {
      if (this.opts.allowUnreadBytes)
        return;
      if (this.bitPos) {
        throw this.err(`${this.bitPos} bits left after unpack: ${hex.encode(this.data.subarray(this.pos))}`);
      }
      if (this.bs && !this.parent) {
        const notRead = Bitset.indices(this.bs, this.data.length, true);
        if (notRead.length) {
          const formatted = Bitset.range(notRead).map(({ pos, length }) => `(${pos}/${length})[${hex.encode(this.data.subarray(pos, pos + length))}]`).join(", ");
          throw this.err(`unread byte ranges: ${formatted} (total=${this.data.length})`);
        } else
          return;
      }
      if (!this.isEnd()) {
        throw this.err(`${this.leftBytes} bytes ${this.bitPos} bits left after unpack: ${hex.encode(this.data.subarray(this.pos))}`);
      }
    }
    // User methods
    err(msg) {
      return Path.err("Reader", this.stack, msg);
    }
    offsetReader(n) {
      if (!isNum(n) || n < 0 || n > this.data.length)
        throw this.err("offsetReader: Unexpected end of buffer");
      return new __Reader(this.absBytes(n), this.opts, this.stack, this, n);
    }
    bytes(n, peek = false) {
      if (this.bitPos)
        throw this.err("readBytes: bitPos not empty");
      if (!isNum(n) || n < 0)
        throw this.err(`readBytes: wrong length=${n}`);
      if (this.pos + n > this.data.length)
        throw this.err("readBytes: Unexpected end of buffer");
      const slice = this.data.subarray(this.pos, this.pos + n);
      if (!peek)
        this.markBytes(n);
      return slice;
    }
    byte(peek = false) {
      if (this.bitPos)
        throw this.err("readByte: bitPos not empty");
      if (this.pos + 1 > this.data.length)
        throw this.err("readByte: Unexpected end of buffer");
      const data = this.data[this.pos];
      if (!peek)
        this.markBytes(1);
      return data;
    }
    get leftBytes() {
      return this.data.length - this.pos;
    }
    get totalBytes() {
      return this.data.length;
    }
    isEnd() {
      return this.pos >= this.data.length && !this.bitPos;
    }
    progress() {
      return this.pos * 8 - this.bitPos;
    }
    // bits are read in BE mode (left to right): (0b1000_0000).readBits(1) == 1
    bits(bits) {
      if (!isNum(bits) || bits < 0)
        throw this.err(`BitReader: wrong length=${bits}`);
      if (bits > 32)
        throw this.err("BitReader: cannot read more than 32 bits in single call");
      let out = 0;
      while (bits) {
        if (!this.bitPos) {
          this.bitBuf = this.byte();
          this.bitPos = 8;
        }
        const take = Math.min(bits, this.bitPos);
        this.bitPos -= take;
        out = out << take | this.bitBuf >> this.bitPos & 2 ** take - 1;
        this.bitBuf &= 2 ** this.bitPos - 1;
        bits -= take;
      }
      return out >>> 0;
    }
    find(needle, pos = this.pos) {
      if (!isBytes4(needle))
        throw this.err(`find: needle is not bytes! ${needle}`);
      if (this.bitPos)
        throw this.err("find: bitPos not empty");
      if (!needle.length)
        throw this.err(`find: needle is empty`);
      if (!isNum(pos) || pos < 0)
        throw this.err(`find: wrong pos=${pos}`);
      return findBytes(needle, this.data, pos);
    }
  };
  var _Writer = class {
    pos = 0;
    stack;
    // We could have a single buffer here and re-alloc it with
    // x1.5-2 size each time it full, but it will be slower:
    // basic/encode bench: 395ns -> 560ns
    buffers = [];
    cleanBuffers = [];
    ptrs = [];
    bitBuf = 0;
    bitPos = 0;
    viewBuf = new Uint8Array(8);
    view;
    finished = false;
    constructor(stack = []) {
      this.stack = stack;
      this.view = createView2(this.viewBuf);
    }
    pushObj(obj, objFn) {
      return Path.pushObj(this.stack, obj, objFn);
    }
    writeView(len, fn) {
      if (this.finished)
        throw this.err("buffer: finished");
      if (!isNum(len) || len < 0 || len > 8)
        throw new Error(`wrong writeView length=${len}`);
      fn(this.view);
      const buf = this.viewBuf.slice(0, len);
      this.bytes(buf);
      this.cleanBuffers.push(buf);
      this.viewBuf.fill(0);
    }
    // User methods
    err(msg) {
      return Path.err("Writer", this.stack, msg);
    }
    bytes(b) {
      if (this.finished)
        throw this.err("buffer: finished");
      if (this.bitPos)
        throw this.err("writeBytes: ends with non-empty bit buffer");
      this.buffers.push(b);
      this.pos += b.length;
    }
    byte(b) {
      if (this.finished)
        throw this.err("buffer: finished");
      if (this.bitPos)
        throw this.err("writeByte: ends with non-empty bit buffer");
      if (!isNum(b) || b < 0 || b > 255)
        throw this.err(`writeByte: wrong value=${b}`);
      const buf = new Uint8Array([b]);
      this.buffers.push(buf);
      this.cleanBuffers.push(buf);
      this.pos++;
    }
    finish(clean2 = true) {
      if (this.finished)
        throw this.err("buffer: finished");
      if (this.bitPos)
        throw this.err("buffer: ends with non-empty bit buffer");
      const buffers = this.buffers.concat(this.ptrs.map((i) => i.buffer));
      const sum = buffers.map((b) => b.length).reduce((a, b) => a + b, 0);
      const buf = new Uint8Array(sum);
      for (let i = 0, pad = 0; i < buffers.length; i++) {
        const a = buffers[i];
        buf.set(a, pad);
        pad += a.length;
      }
      for (let pos = this.pos, i = 0; i < this.ptrs.length; i++) {
        const ptr = this.ptrs[i];
        buf.set(ptr.ptr.encode(pos), ptr.pos);
        pos += ptr.buffer.length;
      }
      if (clean2) {
        for (const b of this.cleanBuffers)
          b.fill(0);
        this.buffers = [];
        this.cleanBuffers = [];
        for (const p of this.ptrs)
          p.buffer.fill(0);
        this.ptrs = [];
        this.finished = true;
        this.bitBuf = 0;
      }
      return buf;
    }
    bits(value, bits) {
      if (this.finished)
        throw this.err("buffer: finished");
      if (!isNum(bits) || bits < 0)
        throw this.err(`writeBits: wrong length=${bits}`);
      if (bits > 32)
        throw this.err("writeBits: cannot write more than 32 bits in single call");
      if (!isNum(value) || value < 0)
        throw this.err(`writeBits: wrong value=${value}`);
      if (value >= 2 ** bits)
        throw this.err(`writeBits: value (${value}) >= 2**bits (${bits})`);
      while (bits) {
        const take = Math.min(bits, 8 - this.bitPos);
        this.bitBuf = this.bitBuf << take | value >> bits - take;
        this.bitPos += take;
        bits -= take;
        value &= 2 ** bits - 1;
        if (this.bitPos === 8) {
          this.bitPos = 0;
          const buf = new Uint8Array([this.bitBuf]);
          this.buffers.push(buf);
          this.cleanBuffers.push(buf);
          this.pos++;
        }
      }
    }
  };
  var swapEndianness = (b) => Uint8Array.from(b).reverse();
  function checkBounds(value, bits, signed) {
    if (signed) {
      if (bits <= _0n7)
        throw new Error(`checkBounds: signed bits must be positive, got ${bits}`);
      const signBit = _2n5 ** (bits - _1n6);
      if (value < -signBit || value >= signBit)
        throw new Error(`value out of signed bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
    } else {
      const max = _2n5 ** bits;
      if (_0n7 > value || value >= max)
        throw new Error(`value out of unsigned bounds. Expected 0 <= ${value} < ${max}`);
    }
  }
  function _wrap(inner) {
    const _inner = inner;
    return {
      // NOTE: we cannot export validate here, since it is likely mistake.
      // Raw inner throws propagate unchanged; path-aware errors must use w.err/r.err or validate().
      encodeStream: _inner.encodeStream,
      decodeStream: _inner.decodeStream,
      size: _inner.size,
      encode: (value) => {
        const w = new _Writer();
        _inner.encodeStream(w, value);
        return w.finish();
      },
      decode: (data, opts = {}) => {
        const r = new _Reader(data, opts);
        const res = _inner.decodeStream(r);
        r.finish();
        return res;
      }
    };
  }
  function validate(inner, fn) {
    if (!isCoder(inner))
      throw new TypeError(`validate: invalid inner value ${inner}`);
    if (typeof fn !== "function")
      throw new TypeError("validate: fn should be function");
    return _wrap({
      size: inner.size,
      encodeStream: (w, value) => {
        let res;
        try {
          res = fn(value);
        } catch (e) {
          throw w.err(e);
        }
        inner.encodeStream(w, res);
      },
      decodeStream: (r) => {
        const res = inner.decodeStream(r);
        try {
          return fn(res);
        } catch (e) {
          throw r.err(e);
        }
      }
    });
  }
  var wrap = (inner) => {
    const _inner = inner;
    if (!isPlainObject(_inner))
      throw new TypeError(`wrap: invalid inner value ${_inner}`);
    if (typeof _inner.encodeStream !== "function")
      throw new TypeError("wrap: encodeStream should be function");
    if (typeof _inner.decodeStream !== "function")
      throw new TypeError("wrap: decodeStream should be function");
    if (_inner.size !== void 0 && (!isNum(_inner.size) || _inner.size < 0))
      throw new TypeError(`wrap: invalid size ${_inner.size}`);
    if (_inner.validate !== void 0 && typeof _inner.validate !== "function")
      throw new TypeError("wrap: validate should be function");
    const res = _wrap(_inner);
    return _inner.validate !== void 0 ? validate(res, _inner.validate) : res;
  };
  var isBaseCoder = (elm) => isPlainObject(elm) && typeof elm.decode === "function" && typeof elm.encode === "function";
  function isCoder(elm) {
    return isPlainObject(elm) && isBaseCoder(elm) && typeof elm.encodeStream === "function" && typeof elm.decodeStream === "function" && (elm.size === void 0 || isNum(elm.size) && elm.size >= 0);
  }
  function dict() {
    return {
      encode: (from) => {
        if (!Array.isArray(from))
          throw new Error("array expected");
        const to = {};
        const seen = /* @__PURE__ */ new Set();
        for (const item of from) {
          if (!Array.isArray(item) || item.length !== 2)
            throw new Error(`array of two elements expected`);
          const name = item[0];
          const value = item[1];
          validateFieldName(name, "dict: key");
          if (seen.has(name))
            throw new Error(`key(${name}) appears twice in struct`);
          seen.add(name);
          to[name] = value;
        }
        return to;
      },
      decode: (to) => {
        if (!isPlainObject(to))
          throw new Error(`expected plain object, got ${to}`);
        for (const name in to)
          validateFieldName(name, "dict: key");
        return Object.entries(to);
      }
    };
  }
  var numberBigint = /* @__PURE__ */ Object.freeze({
    encode: (from) => {
      if (typeof from !== "bigint")
        throw new Error(`expected bigint, got ${typeof from}`);
      if (from > BigInt(Number.MAX_SAFE_INTEGER))
        throw new Error(`element bigger than MAX_SAFE_INTEGER=${from}`);
      if (from < BigInt(Number.MIN_SAFE_INTEGER))
        throw new Error(`element smaller than MIN_SAFE_INTEGER=${from}`);
      return Number(from);
    },
    decode: (to) => {
      if (!isNum(to))
        throw new Error("element is not a safe integer");
      return BigInt(to);
    }
  });
  function tsEnum(e) {
    if (!isPlainObject(e))
      throw new Error("plain object expected");
    return {
      encode: (from) => {
        if (!isNum(from) || !(from in e))
          throw new Error(`wrong value ${from}`);
        return e[from];
      },
      decode: (to) => {
        if (typeof to !== "string")
          throw new Error(`wrong value ${typeof to}`);
        const value = e[to];
        if (!hasOwn(e, to) || !isNum(value))
          throw new Error(`wrong value ${to}`);
        return value;
      }
    };
  }
  function decimal(precision, round = false) {
    if (!isNum(precision) || precision < 0)
      throw new Error(`decimal/precision: wrong value ${precision}`);
    if (typeof round !== "boolean")
      throw new Error(`decimal/round: expected boolean, got ${typeof round}`);
    const decimalMask = _10n ** BigInt(precision);
    return {
      encode: (from) => {
        if (typeof from !== "bigint")
          throw new Error(`expected bigint, got ${typeof from}`);
        let s = (from < _0n7 ? -from : from).toString(10);
        let sep = s.length - precision;
        if (sep < 0) {
          s = s.padStart(s.length - sep, "0");
          sep = 0;
        }
        let i = s.length - 1;
        for (; i >= sep && s[i] === "0"; i--)
          ;
        let int = s.slice(0, sep);
        let frac = s.slice(sep, i + 1);
        if (!int)
          int = "0";
        if (from < _0n7)
          int = "-" + int;
        if (!frac)
          return int;
        return `${int}.${frac}`;
      },
      decode: (to) => {
        if (typeof to !== "string")
          throw new Error(`expected string, got ${typeof to}`);
        let neg = false;
        if (to.startsWith("-")) {
          neg = true;
          to = to.slice(1);
        }
        if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(to))
          throw new Error(`wrong string value=${to}`);
        let sep = to.indexOf(".");
        sep = sep === -1 ? to.length : sep;
        const intS = to.slice(0, sep);
        const fracS = to.slice(sep + 1).replace(/0+$/, "");
        const int = BigInt(intS) * decimalMask;
        if (!round && fracS.length > precision) {
          throw new Error(`fractional part cannot be represented with this precision (num=${to}, prec=${precision})`);
        }
        const fracLen = Math.min(fracS.length, precision);
        const frac = BigInt(fracS.slice(0, fracLen)) * _10n ** BigInt(precision - fracLen);
        const value = int + frac;
        if (neg && value === _0n7)
          throw new Error(`negative zero is not allowed`);
        return neg ? -value : value;
      }
    };
  }
  function match(lst) {
    if (!Array.isArray(lst))
      throw new Error(`expected array, got ${typeof lst}`);
    for (const i of lst)
      if (!isBaseCoder(i))
        throw new Error(`wrong base coder ${i}`);
    return {
      encode: (from) => {
        for (const c of lst) {
          let elm;
          try {
            elm = c.encode(from);
          } catch {
            continue;
          }
          if (elm !== void 0)
            return elm;
        }
        throw new Error(`match/encode: cannot find match in ${from}`);
      },
      decode: (to) => {
        for (const c of lst) {
          let elm;
          try {
            elm = c.decode(to);
          } catch {
            continue;
          }
          if (elm !== void 0)
            return elm;
        }
        throw new Error(`match/decode: cannot find match in ${to}`);
      }
    };
  }
  var reverse = (coder) => {
    if (!isBaseCoder(coder))
      throw new Error("BaseCoder expected");
    return { encode: (to) => coder.decode(to), decode: (from) => coder.encode(from) };
  };
  var coders = /* @__PURE__ */ Object.freeze({ dict, numberBigint, tsEnum, decimal, match, reverse });
  var view = (len, opts) => wrap({
    size: len,
    encodeStream: (w, value) => w.writeView(len, (view2) => opts.write(view2, value)),
    decodeStream: (r) => r.readView(len, opts.read),
    validate: (value) => {
      if (typeof value !== "number")
        throw new TypeError(`viewCoder: expected number, got ${typeof value}`);
      if (opts.validate)
        opts.validate(value);
      return value;
    }
  });
  var intView = (len, signed, opts) => {
    const bits = len * 8;
    const signBit = 2 ** (bits - 1);
    const validateSigned = (value) => {
      if (!isNum(value))
        throw new TypeError(`sintView: value is not safe integer: ${value}`);
      if (value < -signBit || value >= signBit) {
        throw new RangeError(`sintView: value out of bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
      }
    };
    const maxVal = 2 ** bits;
    const validateUnsigned = (value) => {
      if (!isNum(value))
        throw new TypeError(`uintView: value is not safe integer: ${value}`);
      if (0 > value || value >= maxVal) {
        throw new RangeError(`uintView: value out of bounds. Expected 0 <= ${value} < ${maxVal}`);
      }
    };
    return view(len, {
      write: opts.write,
      read: opts.read,
      validate: signed ? validateSigned : validateUnsigned
    });
  };
  var U32LE = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ intView(4, false, {
      read: (view2, pos) => view2.getUint32(pos, true),
      write: (view2, value) => view2.setUint32(0, value, true)
    })
  );
  var U16LE = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ intView(2, false, {
      read: (view2, pos) => view2.getUint16(pos, true),
      write: (view2, value) => view2.setUint16(0, value, true)
    })
  );
  var U8 = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ intView(1, false, {
      read: (view2, pos) => view2.getUint8(pos),
      write: (view2, value) => view2.setUint8(0, value)
    })
  );
  var createBytes = (len, le = false) => {
    if (typeof le !== "boolean")
      throw new TypeError(`bytes/le: expected boolean, got ${typeof le}`);
    const _length = lengthCoder(len);
    const _isb = isBytes4(len);
    const terminator = _isb ? Uint8Array.from(len) : void 0;
    const findTerminator = terminator && terminator.length ? createFindBytes(terminator) : void 0;
    return wrap({
      size: typeof len === "number" ? len : void 0,
      encodeStream: (w, value) => {
        if (!_isb)
          _length.encodeStream(w, value.length);
        w.bytes(le ? swapEndianness(value) : value);
        if (terminator)
          w.bytes(terminator);
      },
      decodeStream: (r) => {
        let bytes;
        if (terminator) {
          const tPos = r.find(terminator);
          if (tPos === void 0)
            throw r.err(`bytes: cannot find terminator`);
          bytes = r.bytes(tPos - r.pos);
          r.bytes(terminator.length);
        } else {
          bytes = r.bytes(len === null ? r.leftBytes : _length.decodeStream(r));
        }
        return le ? swapEndianness(bytes) : bytes;
      },
      validate: (value) => {
        if (!isBytes4(value))
          throw new TypeError(`bytes: invalid value ${value}`);
        if (findTerminator) {
          const data = le ? swapEndianness(value) : value;
          if (findTerminator(data) !== void 0)
            throw new Error("bytes: value contains terminator");
        }
        return value;
      }
    });
  };
  function apply(inner, base) {
    if (!isCoder(inner))
      throw new TypeError(`apply: invalid inner value ${inner}`);
    if (!isBaseCoder(base))
      throw new TypeError(`apply: invalid base value ${base}`);
    return wrap({
      size: inner.size,
      encodeStream: (w, value) => {
        let innerValue;
        try {
          innerValue = base.decode(value);
        } catch (e) {
          throw w.err("" + e);
        }
        return inner.encodeStream(w, innerValue);
      },
      decodeStream: (r) => {
        const innerValue = inner.decodeStream(r);
        try {
          return base.encode(innerValue);
        } catch (e) {
          throw r.err("" + e);
        }
      }
    });
  }
  function sizeof(fields) {
    let size = 0;
    for (const f of fields) {
      if (f.size === void 0)
        return;
      if (!isNum(f.size))
        throw new Error(`sizeof: wrong element size=${size}`);
      size += f.size;
    }
    return size;
  }
  function struct(fields) {
    if (!isPlainObject(fields))
      throw new TypeError(`struct: expected plain object, got ${fields}`);
    const coders2 = [];
    for (const name in fields) {
      validateFieldName(name, "struct: field");
      if (!isCoder(fields[name]))
        throw new TypeError(`struct: field ${name} is not CoderType`);
      coders2.push(fields[name]);
    }
    return wrap({
      size: sizeof(coders2),
      encodeStream: (w, value) => {
        w.pushObj(value, (fieldFn) => {
          for (const name in fields)
            fieldFn(name, () => fields[name].encodeStream(w, value[name]));
        });
      },
      decodeStream: (r) => {
        const res = {};
        r.pushObj(res, (fieldFn) => {
          for (const name in fields)
            fieldFn(name, () => res[name] = fields[name].decodeStream(r));
        });
        return res;
      },
      validate: (value) => {
        if (typeof value !== "object" || value === null)
          throw new Error(`struct: invalid value ${value}`);
        return value;
      }
    });
  }
  function array(len, inner) {
    if (!isCoder(inner))
      throw new TypeError(`array: invalid inner value ${inner}`);
    const _length = lengthCoder(typeof len === "string" ? `../${len}` : len);
    if (len === null && inner.size === 0)
      throw new Error("array: null length cannot use zero-size inner");
    return wrap({
      // `size: 0` is a valid fixed-size hint and must compose through arrays/tuples/structs.
      size: typeof len === "number" && inner.size !== void 0 ? len * inner.size : void 0,
      encodeStream: (w, value) => {
        const _w = w;
        _w.pushObj(value, (fieldFn) => {
          if (!isBytes4(len))
            _length.encodeStream(w, value.length);
          for (let i = 0; i < value.length; i++) {
            fieldFn(`${i}`, () => {
              const elm = value[i];
              const startPos = w.pos;
              inner.encodeStream(w, elm);
              if (isBytes4(len)) {
                if (len.length > _w.pos - startPos)
                  return;
                const data = _w.finish(false).subarray(startPos, _w.pos);
                if (equalBytes2(data.subarray(0, len.length), len))
                  throw _w.err(`array: inner element encoding same as separator. elm=${elm} data=${data}`);
              }
            });
          }
        });
        if (isBytes4(len))
          w.bytes(len);
      },
      decodeStream: (r) => {
        const res = [];
        const _r = r;
        _r.pushObj(res, (fieldFn) => {
          if (len === null) {
            for (let i = 0; !r.isEnd(); i++) {
              fieldFn(`${i}`, () => {
                const progress = _r.progress();
                res.push(inner.decodeStream(r));
                if (_r.progress() === progress)
                  throw r.err("array: inner decoder did not consume input");
              });
              if (inner.size && r.leftBytes < inner.size)
                break;
            }
          } else if (isBytes4(len)) {
            for (let i = 0; ; i++) {
              if (equalBytes2(r.bytes(len.length, true), len)) {
                r.bytes(len.length);
                break;
              }
              fieldFn(`${i}`, () => {
                const progress = _r.progress();
                res.push(inner.decodeStream(r));
                if (_r.progress() === progress)
                  throw r.err("array: inner decoder did not consume input");
              });
            }
          } else {
            let length;
            fieldFn("arrayLen", () => length = _length.decodeStream(r));
            for (let i = 0; i < length; i++)
              fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
          }
        });
        return res;
      },
      validate: (value) => {
        if (!Array.isArray(value))
          throw new Error(`array: invalid value ${value}`);
        return value;
      }
    });
  }

  // node_modules/@scure/btc-signer/utils.js
  var Point2 = /* @__PURE__ */ (() => secp256k1.Point)();
  var CURVE_ORDER = /* @__PURE__ */ (() => Point2.Fn.ORDER)();
  var hasEven2 = (y) => y % 2n === 0n;
  var isBytes5 = /* @__PURE__ */ (() => utils.isBytes)();
  var concatBytes4 = /* @__PURE__ */ (() => utils.concatBytes)();
  var equalBytes3 = /* @__PURE__ */ (() => utils.equalBytes)();
  var sha2562 = /* @__PURE__ */ (() => sha256)();
  var tagSchnorr = (tag, ...messages) => schnorr.utils.taggedHash(tag, ...messages);
  var PubT = /* @__PURE__ */ (() => Object.freeze({
    ecdsa: 0,
    schnorr: 1
  }))();
  function validatePubkey(pub, type) {
    const len = pub.length;
    if (type === PubT.ecdsa) {
      if (len === 32)
        throw new RangeError("Expected non-Schnorr key");
      Point2.fromBytes(pub);
      return pub;
    } else if (type === PubT.schnorr) {
      if (len !== 32)
        throw new RangeError("Expected 32-byte Schnorr key");
      schnorr.utils.lift_x(bytesToNumberBE(pub));
      return pub;
    } else {
      throw new TypeError("Unknown key type");
    }
  }
  function tapTweak(a, b) {
    const u = schnorr.utils;
    const t = u.taggedHash("TapTweak", a, b);
    const tn = bytesToNumberBE(t);
    if (tn >= CURVE_ORDER)
      throw new Error("tweak higher than curve order");
    return tn;
  }
  function taprootTweakPubkey(pubKey, h) {
    const u = schnorr.utils;
    abytes2(pubKey, 32, "pubKey");
    const t = tapTweak(pubKey, h);
    const P = u.lift_x(bytesToNumberBE(pubKey));
    const Q = P.add(Point2.BASE.multiply(t));
    const parity = hasEven2(Q.y) ? 0 : 1;
    return [u.pointToBytes(Q), parity];
  }
  var TAPROOT_UNSPENDABLE_KEY = /* @__PURE__ */ (() => sha2562(Point2.BASE.toBytes(false)))();
  var NETWORK = /* @__PURE__ */ Object.freeze({
    bech32: "bc",
    pubKeyHash: 0,
    scriptHash: 5,
    wif: 128
  });
  function compareBytes(a, b) {
    if (!isBytes5(a) || !isBytes5(b))
      throw new TypeError(`cmp: wrong type a=${typeof a} b=${typeof b}`);
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++)
      if (a[i] != b[i])
        return Math.sign(a[i] - b[i]);
    return Math.sign(a.length - b.length);
  }
  function reverseObject(obj) {
    const res = /* @__PURE__ */ Object.create(null);
    for (const k in obj) {
      if (res[obj[k]] !== void 0)
        throw new Error("duplicate key");
      res[obj[k]] = k;
    }
    return res;
  }

  // node_modules/@scure/btc-signer/script.js
  var OP = /* @__PURE__ */ Object.freeze({
    OP_0: 0,
    PUSHDATA1: 76,
    PUSHDATA2: 77,
    PUSHDATA4: 78,
    "1NEGATE": 79,
    RESERVED: 80,
    OP_1: 81,
    OP_2: 82,
    OP_3: 83,
    OP_4: 84,
    OP_5: 85,
    OP_6: 86,
    OP_7: 87,
    OP_8: 88,
    OP_9: 89,
    OP_10: 90,
    OP_11: 91,
    OP_12: 92,
    OP_13: 93,
    OP_14: 94,
    OP_15: 95,
    OP_16: 96,
    // Control
    NOP: 97,
    VER: 98,
    IF: 99,
    NOTIF: 100,
    VERIF: 101,
    VERNOTIF: 102,
    ELSE: 103,
    ENDIF: 104,
    VERIFY: 105,
    RETURN: 106,
    // Stack
    TOALTSTACK: 107,
    FROMALTSTACK: 108,
    "2DROP": 109,
    "2DUP": 110,
    "3DUP": 111,
    "2OVER": 112,
    "2ROT": 113,
    "2SWAP": 114,
    IFDUP: 115,
    DEPTH: 116,
    DROP: 117,
    DUP: 118,
    NIP: 119,
    OVER: 120,
    PICK: 121,
    ROLL: 122,
    ROT: 123,
    SWAP: 124,
    TUCK: 125,
    // Splice
    CAT: 126,
    SUBSTR: 127,
    LEFT: 128,
    RIGHT: 129,
    SIZE: 130,
    // Boolean logic
    INVERT: 131,
    AND: 132,
    OR: 133,
    XOR: 134,
    EQUAL: 135,
    EQUALVERIFY: 136,
    RESERVED1: 137,
    RESERVED2: 138,
    // Numbers
    "1ADD": 139,
    "1SUB": 140,
    "2MUL": 141,
    "2DIV": 142,
    NEGATE: 143,
    ABS: 144,
    NOT: 145,
    "0NOTEQUAL": 146,
    ADD: 147,
    SUB: 148,
    MUL: 149,
    DIV: 150,
    MOD: 151,
    LSHIFT: 152,
    RSHIFT: 153,
    BOOLAND: 154,
    BOOLOR: 155,
    NUMEQUAL: 156,
    NUMEQUALVERIFY: 157,
    NUMNOTEQUAL: 158,
    LESSTHAN: 159,
    GREATERTHAN: 160,
    LESSTHANOREQUAL: 161,
    GREATERTHANOREQUAL: 162,
    MIN: 163,
    MAX: 164,
    WITHIN: 165,
    // Crypto
    RIPEMD160: 166,
    SHA1: 167,
    SHA256: 168,
    HASH160: 169,
    HASH256: 170,
    CODESEPARATOR: 171,
    CHECKSIG: 172,
    CHECKSIGVERIFY: 173,
    CHECKMULTISIG: 174,
    CHECKMULTISIGVERIFY: 175,
    // Expansion
    NOP1: 176,
    CHECKLOCKTIMEVERIFY: 177,
    CHECKSEQUENCEVERIFY: 178,
    NOP4: 179,
    NOP5: 180,
    NOP6: 181,
    NOP7: 182,
    NOP8: 183,
    NOP9: 184,
    NOP10: 185,
    // BIP 342
    CHECKSIGADD: 186,
    // Invalid
    INVALID: 255
  });
  var OPNames = /* @__PURE__ */ (() => Object.freeze(reverseObject(OP)))();
  function ScriptNum(bytesLimit = 6, forceMinimal = false) {
    return wrap({
      encodeStream: (w, value) => {
        if (value === 0n)
          return;
        const neg = value < 0;
        const val = BigInt(value);
        const nums = [];
        for (let abs = neg ? -val : val; abs; abs >>= 8n)
          nums.push(Number(abs & 0xffn));
        if (nums[nums.length - 1] >= 128)
          nums.push(neg ? 128 : 0);
        else if (neg)
          nums[nums.length - 1] |= 128;
        w.bytes(new Uint8Array(nums));
      },
      decodeStream: (r) => {
        const len = r.leftBytes;
        if (len > bytesLimit)
          throw new Error(`ScriptNum: number (${len}) bigger than limit=${bytesLimit}`);
        if (len === 0)
          return 0n;
        if (forceMinimal) {
          const data = r.bytes(len, true);
          if ((data[data.length - 1] & 127) === 0) {
            if (len <= 1 || (data[data.length - 2] & 128) === 0)
              throw new Error("Non-minimally encoded ScriptNum");
          }
        }
        let last = 0;
        let res = 0n;
        for (let i = 0; i < len; ++i) {
          last = r.byte();
          res |= BigInt(last) << 8n * BigInt(i);
        }
        if (last >= 128) {
          res &= 2n ** BigInt(len * 8) - 1n >> 1n;
          res = -res;
        }
        return res;
      }
    });
  }
  function OpToNum(op, bytesLimit = 4, forceMinimal = true) {
    if (typeof op === "number")
      return op;
    if (isBytes5(op)) {
      try {
        const val = ScriptNum(bytesLimit, forceMinimal).decode(op);
        if (val > Number.MAX_SAFE_INTEGER)
          return;
        return Number(val);
      } catch (e) {
        return;
      }
    }
    return;
  }
  var scriptPushLen = (op, read) => {
    if (!(OP.OP_0 < op && op <= OP.PUSHDATA4))
      return;
    if (op < OP.PUSHDATA1)
      return op;
    if (op === OP.PUSHDATA1)
      return read(1);
    if (op === OP.PUSHDATA2)
      return read(2);
    if (op === OP.PUSHDATA4)
      return read(4);
    throw new Error("Should be not possible");
  };
  var Script = /* @__PURE__ */ (() => Object.freeze(wrap({
    encodeStream: (w, value) => {
      for (let o of value) {
        if (typeof o === "string") {
          if (OP[o] === void 0)
            throw new Error(`Unknown opcode=${o}`);
          w.byte(OP[o]);
          continue;
        } else if (typeof o === "number") {
          if (o === 0) {
            w.byte(0);
            continue;
          } else if (o === -1) {
            w.byte(OP["1NEGATE"]);
            continue;
          } else if (1 <= o && o <= 16) {
            w.byte(OP.OP_1 - 1 + o);
            continue;
          }
        }
        if (typeof o === "number")
          o = ScriptNum().encode(BigInt(o));
        if (!isBytes5(o))
          throw new Error(`Wrong Script OP=${o} (${typeof o})`);
        const len = o.length;
        if (len < OP.PUSHDATA1)
          w.byte(len);
        else if (len <= 255) {
          w.byte(OP.PUSHDATA1);
          w.byte(len);
        } else if (len <= 65535) {
          w.byte(OP.PUSHDATA2);
          w.bytes(U16LE.encode(len));
        } else {
          w.byte(OP.PUSHDATA4);
          w.bytes(U32LE.encode(len));
        }
        w.bytes(o);
      }
    },
    decodeStream: (r) => {
      const out = [];
      while (!r.isEnd()) {
        const cur = r.byte();
        const len = scriptPushLen(cur, (bytes) => {
          if (bytes === 1)
            return U8.decodeStream(r);
          if (bytes === 2)
            return U16LE.decodeStream(r);
          return U32LE.decodeStream(r);
        });
        if (len !== void 0) {
          out.push(r.bytes(len));
        } else if (cur === 0) {
          out.push(0);
        } else if (OP.OP_1 <= cur && cur <= OP.OP_16) {
          out.push(cur - (OP.OP_1 - 1));
        } else {
          const op = OPNames[cur];
          if (op === void 0)
            throw new Error(`Unknown opcode=${cur.toString(16)}`);
          out.push(op);
        }
      }
      return out;
    }
  })))();
  var CSLimits = {
    253: [253, 2, 253n, 65535n],
    254: [254, 4, 65536n, 4294967295n],
    255: [255, 8, 4294967296n, 18446744073709551615n]
  };
  var CompactSize = /* @__PURE__ */ (() => Object.freeze(wrap({
    encodeStream: (w, value) => {
      if (typeof value === "number")
        value = BigInt(value);
      if (0n <= value && value <= 252n)
        return w.byte(Number(value));
      for (const [flag2, bytes, start, stop] of Object.values(CSLimits)) {
        if (start > value || value > stop)
          continue;
        w.byte(flag2);
        for (let i = 0; i < bytes; i++)
          w.byte(Number(value >> 8n * BigInt(i) & 0xffn));
        return;
      }
      throw w.err(`VarInt too big: ${value}`);
    },
    decodeStream: (r) => {
      const b0 = r.byte();
      if (b0 <= 252)
        return BigInt(b0);
      const [_, bytes, start] = CSLimits[b0];
      let num2 = 0n;
      for (let i = 0; i < bytes; i++)
        num2 |= BigInt(r.byte()) << 8n * BigInt(i);
      if (num2 < start)
        throw r.err(`Wrong CompactSize(${8 * bytes})`);
      return num2;
    }
  })))();
  var _VarBytes = /* @__PURE__ */ (() => Object.freeze(createBytes(CompactSize)))();
  var VarBytes = _VarBytes;

  // node_modules/@scure/btc-signer/psbt.js
  var _TaprootControlBlock = /* @__PURE__ */ (() => struct({
    version: U8,
    // With parity :(
    internalKey: createBytes(32),
    merklePath: array(null, createBytes(32))
  }))();
  var TaprootControlBlock = /* @__PURE__ */ (() => Object.freeze(validate(_TaprootControlBlock, (cb) => {
    if (cb.merklePath.length > 128)
      throw new Error("TaprootControlBlock: merklePath should be of length 0..128 (inclusive)");
    return cb;
  })))();

  // node_modules/@scure/btc-signer/payment.js
  var OutP2A = {
    encode(from) {
      if (from.length !== 2 || from[0] !== 1 || !isBytes5(from[1]) || hex.encode(from[1]) !== "4e73")
        return;
      return { type: "p2a", script: Script.encode(from) };
    },
    decode: (to) => {
      if (to.type !== "p2a")
        return;
      return [1, hex.decode("4e73")];
    }
  };
  function isValidPubkey(pub, type) {
    try {
      validatePubkey(pub, type);
      return true;
    } catch (e) {
      return false;
    }
  }
  var OutPK = {
    encode(from) {
      if (from.length !== 2 || !isBytes5(from[0]) || !isValidPubkey(from[0], PubT.ecdsa) || from[1] !== "CHECKSIG")
        return;
      return { type: "pk", pubkey: from[0] };
    },
    decode: (to) => {
      if (to.type !== "pk")
        return;
      return [to.pubkey, "CHECKSIG"];
    }
  };
  var OutPKH = {
    encode(from) {
      if (from.length !== 5 || from[0] !== "DUP" || from[1] !== "HASH160" || !isBytes5(from[2]))
        return;
      if (from[3] !== "EQUALVERIFY" || from[4] !== "CHECKSIG")
        return;
      return { type: "pkh", hash: from[2] };
    },
    // OutScript validates `pkh.hash` before this branch emits the canonical
    // `DUP HASH160 <hash> EQUALVERIFY CHECKSIG` script.
    decode: (to) => to.type === "pkh" ? ["DUP", "HASH160", to.hash, "EQUALVERIFY", "CHECKSIG"] : void 0
  };
  var OutSH = {
    encode(from) {
      if (from.length !== 3 || from[0] !== "HASH160" || !isBytes5(from[1]) || from[2] !== "EQUAL")
        return;
      return { type: "sh", hash: from[1] };
    },
    // OutScript validates `sh.hash` before this branch emits the canonical
    // `HASH160 <hash> EQUAL` script.
    decode: (to) => to.type === "sh" ? ["HASH160", to.hash, "EQUAL"] : void 0
  };
  var OutWSH = {
    encode(from) {
      if (from.length !== 2 || from[0] !== 0 || !isBytes5(from[1]))
        return;
      if (from[1].length !== 32)
        return;
      return { type: "wsh", hash: from[1] };
    },
    // OutScript validates `wsh.hash` before this branch emits the canonical
    // version-0 32-byte witness program.
    decode: (to) => to.type === "wsh" ? [0, to.hash] : void 0
  };
  var OutWPKH = {
    encode(from) {
      if (from.length !== 2 || from[0] !== 0 || !isBytes5(from[1]))
        return;
      if (from[1].length !== 20)
        return;
      return { type: "wpkh", hash: from[1] };
    },
    // OutScript validates `wpkh.hash` before this branch emits the canonical
    // version-0 20-byte witness program.
    decode: (to) => to.type === "wpkh" ? [0, to.hash] : void 0
  };
  var OutMS = {
    encode(from) {
      const last = from.length - 1;
      if (from[last] !== "CHECKMULTISIG")
        return;
      const m = from[0];
      const n = from[last - 1];
      if (typeof m !== "number" || typeof n !== "number")
        return;
      const pubkeys = from.slice(1, -2);
      if (n !== pubkeys.length)
        return;
      for (const pub of pubkeys)
        if (!isBytes5(pub))
          return;
      return { type: "ms", m, pubkeys };
    },
    // checkmultisig(n, ..pubkeys, m)
    decode: (to) => (
      // OutScript validates multisig pubkeys and `0 < m <= n <= 16`.
      // This branch only emits the canonical `m <pubkeys...> n CHECKMULTISIG`
      // script.
      to.type === "ms" ? [to.m, ...to.pubkeys, to.pubkeys.length, "CHECKMULTISIG"] : void 0
    )
  };
  var OutTR = {
    encode(from) {
      if (from.length !== 2 || from[0] !== 1 || !isBytes5(from[1]) || from[1].length !== 32)
        return;
      return { type: "tr", pubkey: from[1] };
    },
    // OutScript validates `tr.pubkey` before this branch emits the canonical
    // version-1 32-byte witness program.
    decode: (to) => to.type === "tr" ? [1, to.pubkey] : void 0
  };
  var OutTRNS = {
    encode(from) {
      const last = from.length - 1;
      if (from[last] !== "CHECKSIG")
        return;
      const pubkeys = [];
      for (let i = 0; i < last; i++) {
        const elm = from[i];
        if (i & 1) {
          if (elm !== "CHECKSIGVERIFY" || i === last - 1)
            return;
          continue;
        }
        if (!isBytes5(elm) || !isValidPubkey(elm, PubT.schnorr))
          return;
        pubkeys.push(elm);
      }
      if (!pubkeys.length)
        return;
      return { type: "tr_ns", pubkeys };
    },
    decode: (to) => {
      if (to.type !== "tr_ns")
        return;
      const out = [];
      for (let i = 0; i < to.pubkeys.length - 1; i++)
        out.push(to.pubkeys[i], "CHECKSIGVERIFY");
      out.push(to.pubkeys[to.pubkeys.length - 1], "CHECKSIG");
      return out;
    }
  };
  var OutTRMS = {
    encode(from) {
      const last = from.length - 1;
      if (from[last] !== "NUMEQUAL" || from[1] !== "CHECKSIG")
        return;
      const pubkeys = [];
      const m = OpToNum(from[last - 1]);
      if (typeof m !== "number")
        return;
      for (let i = 0; i < last - 1; i++) {
        const elm = from[i];
        if (i & 1) {
          if (elm !== (i === 1 ? "CHECKSIG" : "CHECKSIGADD"))
            return;
          continue;
        }
        if (!isBytes5(elm))
          return;
        pubkeys.push(elm);
      }
      return { type: "tr_ms", pubkeys, m };
    },
    decode: (to) => {
      if (to.type !== "tr_ms")
        return;
      const out = [to.pubkeys[0], "CHECKSIG"];
      for (let i = 1; i < to.pubkeys.length; i++)
        out.push(to.pubkeys[i], "CHECKSIGADD");
      out.push(to.m, "NUMEQUAL");
      return out;
    }
  };
  var OutUnknown = {
    encode(from) {
      return { type: "unknown", script: Script.encode(from) };
    },
    decode: (to) => (
      // This reparses `unknown.script` through the semantic Script codec, so raw
      // bytes must still be syntactically parseable and may canonicalize on re-encode.
      to.type === "unknown" ? Script.decode(to.script) : void 0
    )
  };
  var OutScripts = /* @__PURE__ */ (() => [
    // Order is semantic: specific structured coders run first and the catch-all
    // unknown fallback must stay last.
    OutP2A,
    OutPK,
    OutPKH,
    OutSH,
    OutWSH,
    OutWPKH,
    OutMS,
    OutTR,
    OutTRNS,
    OutTRMS,
    OutUnknown
  ])();
  var _OutScript = /* @__PURE__ */ (() => apply(Script, coders.match(OutScripts)))();
  var OutScript = /* @__PURE__ */ (() => Object.freeze(validate(_OutScript, (i) => {
    if (i.type === "pk" && !isValidPubkey(i.pubkey, PubT.ecdsa))
      throw new Error("OutScript/pk: wrong key");
    if ((i.type === "pkh" || i.type === "sh" || i.type === "wpkh") && (!isBytes5(i.hash) || i.hash.length !== 20))
      throw new Error(`OutScript/${i.type}: wrong hash`);
    if (i.type === "wsh" && (!isBytes5(i.hash) || i.hash.length !== 32))
      throw new Error(`OutScript/wsh: wrong hash`);
    if (i.type === "tr" && (!isBytes5(i.pubkey) || !isValidPubkey(i.pubkey, PubT.schnorr)))
      throw new Error("OutScript/tr: wrong taproot public key");
    if (i.type === "ms" || i.type === "tr_ns" || i.type === "tr_ms") {
      if (!Array.isArray(i.pubkeys))
        throw new Error("OutScript/multisig: wrong pubkeys array");
    }
    if (i.type === "ms") {
      const n = i.pubkeys.length;
      for (const p of i.pubkeys)
        if (!isValidPubkey(p, PubT.ecdsa))
          throw new Error("OutScript/multisig: wrong pubkey");
      anumber(i.m, "m");
      if (i.m <= 0 || n > 16 || i.m > n)
        throw new Error("OutScript/multisig: invalid params");
    }
    if (i.type === "tr_ns" || i.type === "tr_ms") {
      for (const p of i.pubkeys)
        if (!isValidPubkey(p, PubT.schnorr))
          throw new Error(`OutScript/${i.type}: wrong pubkey`);
    }
    if (i.type === "tr_ms") {
      const n = i.pubkeys.length;
      anumber(i.m, "m");
      if (i.m <= 0 || n > 999 || i.m > n)
        throw new Error("OutScript/tr_ms: invalid params");
    }
    return i;
  })))();
  function checkTaprootScript(script, internalPubKey, allowUnknownOutputs = false, customScripts) {
    const out = OutScript.decode(script);
    if (out.type === "unknown") {
      if (customScripts) {
        const cs = apply(Script, coders.match(customScripts));
        const c = cs.decode(script);
        if (c !== void 0) {
          if (typeof c.type !== "string" || !c.type.startsWith("tr_"))
            throw new Error(`P2TR: invalid custom type=${c.type}`);
          return;
        }
      }
      if (allowUnknownOutputs)
        return;
    }
    if (!["tr_ns", "tr_ms"].includes(out.type))
      throw new Error(`P2TR: invalid leaf script=${out.type}`);
    const outms = out;
    if (!allowUnknownOutputs && outms.pubkeys) {
      for (const p of outms.pubkeys) {
        if (equalBytes3(p, TAPROOT_UNSPENDABLE_KEY))
          throw new Error("Unspendable taproot key in leaf script");
        if (equalBytes3(p, internalPubKey)) {
          throw new Error("Using P2TR with leaf script with same key as internal key is not supported");
        }
      }
    }
  }
  function taprootListToTree(taprootList) {
    if (!taprootList.length)
      throw new Error("taprootListToTree: empty tree");
    const lst = Array.from(taprootList);
    while (lst.length >= 2) {
      lst.sort((a2, b2) => (b2.weight || 1) - (a2.weight || 1));
      const b = lst.pop();
      const a = lst.pop();
      const weight = (a?.weight || 1) + (b?.weight || 1);
      lst.push({
        weight,
        // Unwrap children array
        // TODO: Very hard to remove any here
        childs: [a?.childs || a, b?.childs || b]
      });
    }
    const last = lst[0];
    return last?.childs || last;
  }
  function taprootAddPath(tree, path = []) {
    if (!tree)
      throw new Error(`taprootAddPath: empty tree`);
    if (tree.type === "leaf")
      return { ...tree, path };
    if (tree.type !== "branch")
      throw new Error(`taprootAddPath: wrong type=${tree}`);
    return {
      ...tree,
      path,
      // BIP 341 control blocks serialize sibling hashes from leaf to root, so prepend the
      // current sibling before descending into the child subtree.
      left: taprootAddPath(tree.left, [tree.right.hash, ...path]),
      right: taprootAddPath(tree.right, [tree.left.hash, ...path])
    };
  }
  function taprootWalkTree(tree) {
    if (!tree)
      throw new Error(`taprootAddPath: empty tree`);
    if (tree.type === "leaf")
      return [tree];
    if (tree.type !== "branch")
      throw new Error(`taprootWalkTree: wrong type=${tree}`);
    return [...taprootWalkTree(tree.left), ...taprootWalkTree(tree.right)];
  }
  function taprootHashTree(tree, internalPubKey, allowUnknownOutputs = false, customScripts) {
    if (!tree)
      throw new Error("taprootHashTree: empty tree");
    if (Array.isArray(tree) && tree.length === 1)
      tree = tree[0];
    if (!Array.isArray(tree)) {
      const version = tree.leafVersion;
      const { script: leafScript } = tree;
      if (tree.tapLeafScript || tree.tapMerkleRoot && !equalBytes3(tree.tapMerkleRoot, EMPTY))
        throw new Error("P2TR: tapRoot leafScript cannot have tree");
      const script = typeof leafScript === "string" ? hex.decode(leafScript) : leafScript;
      if (!isBytes5(script))
        throw new Error(`checkScript: wrong script type=${script}`);
      checkTaprootScript(script, internalPubKey, allowUnknownOutputs, customScripts);
      return {
        type: "leaf",
        version,
        script,
        hash: tapLeafHash(script, tapLeafVersion(version))
      };
    }
    if (tree.length !== 2)
      tree = taprootListToTree(tree);
    if (tree.length !== 2)
      throw new Error("hashTree: non binary tree!");
    const left = taprootHashTree(tree[0], internalPubKey, allowUnknownOutputs, customScripts);
    const right = taprootHashTree(tree[1], internalPubKey, allowUnknownOutputs, customScripts);
    let [lH, rH] = [left.hash, right.hash];
    if (compareBytes(rH, lH) === -1)
      [lH, rH] = [rH, lH];
    return {
      type: "branch",
      left,
      right,
      hash: tagSchnorr("TapBranch", lH, rH)
    };
  }
  var TAP_LEAF_VERSION = 192;
  var tapLeafVersion = (version) => {
    if (version === void 0)
      return TAP_LEAF_VERSION;
    anumber(version, "leafVersion");
    if (version > 254 || version === 80 || !!(version & 1))
      throw new Error(`P2TR: invalid leafVersion=${version}`);
    return version;
  };
  var tapLeafHash = (script, version = TAP_LEAF_VERSION) => tagSchnorr("TapLeaf", new Uint8Array([tapLeafVersion(version)]), VarBytes.encode(script));
  function p2tr(internalPubKey, tree, network = NETWORK, allowUnknownOutputs = false, customScripts) {
    if (!internalPubKey && !tree)
      throw new Error("p2tr: should have pubKey or scriptTree (or both)");
    const pubKey = typeof internalPubKey === "string" ? hex.decode(internalPubKey) : internalPubKey || TAPROOT_UNSPENDABLE_KEY;
    if (!isValidPubkey(pubKey, PubT.schnorr))
      throw new Error("p2tr: non-schnorr pubkey");
    if (tree) {
      let hashedTree = taprootAddPath(taprootHashTree(tree, pubKey, allowUnknownOutputs, customScripts));
      const tapMerkleRoot = hashedTree.hash;
      const [tweakedPubkey, parity] = taprootTweakPubkey(pubKey, tapMerkleRoot);
      const leaves = taprootWalkTree(hashedTree).map((l) => {
        const version = tapLeafVersion(l.version);
        return {
          ...l,
          // Leaf versions are stored as the base even byte; only the control block adds the
          // output-key parity bit required by BIP 341 script-path spending.
          controlBlock: TaprootControlBlock.encode({
            version: version + parity,
            internalKey: pubKey,
            merklePath: l.path
          })
        };
      });
      return {
        type: "tr",
        script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
        address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
        // For tests
        tweakedPubkey,
        // PSBT stuff
        tapInternalKey: pubKey,
        leaves,
        tapLeafScript: leaves.map((l) => [
          TaprootControlBlock.decode(l.controlBlock),
          concatBytes4(l.script, new Uint8Array([tapLeafVersion(l.version)]))
        ]),
        tapMerkleRoot
      };
    } else {
      const tweakedPubkey = taprootTweakPubkey(pubKey, EMPTY)[0];
      return {
        type: "tr",
        script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
        address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
        // For tests
        tweakedPubkey,
        // PSBT stuff
        tapInternalKey: pubKey
      };
    }
  }
  var base58check2 = /* @__PURE__ */ createBase58check(sha2562);
  function validateWitness(version, data) {
    if (data.length < 2 || data.length > 40)
      throw new Error("Witness: invalid length");
    if (version > 16)
      throw new Error("Witness: invalid version");
    if (version === 0 && !(data.length === 20 || data.length === 32))
      throw new Error("Witness: invalid length for version");
  }
  function programToWitness(version, data, network = NETWORK) {
    validateWitness(version, data);
    const coder = version === 0 ? bech32 : bech32m;
    return coder.encode(network.bech32, [version].concat(coder.toWords(data)));
  }
  function formatKey(hashed, prefix2) {
    return base58check2.encode(concatBytes4(Uint8Array.from(prefix2), hashed));
  }
  function Address(network = NETWORK) {
    return {
      encode(from) {
        const { type } = from;
        if (type === "wpkh")
          return programToWitness(0, from.hash, network);
        else if (type === "wsh")
          return programToWitness(0, from.hash, network);
        else if (type === "tr")
          return programToWitness(1, from.pubkey, network);
        else if (type === "pkh")
          return formatKey(from.hash, [network.pubKeyHash]);
        else if (type === "sh")
          return formatKey(from.hash, [network.scriptHash]);
        throw new Error(`Unknown address type=${type}`);
      },
      decode(address) {
        if (address.length < 14 || address.length > 74)
          throw new Error("Invalid address length");
        if (network.bech32 && address.toLowerCase().startsWith(`${network.bech32}1`)) {
          let res;
          try {
            res = bech32.decode(address);
            if (res.words[0] !== 0)
              throw new Error(`bech32: wrong version=${res.words[0]}`);
          } catch (_) {
            res = bech32m.decode(address);
            if (res.words[0] === 0)
              throw new Error(`bech32m: wrong version=${res.words[0]}`);
          }
          if (res.prefix !== network.bech32)
            throw new Error(`wrong bech32 prefix=${res.prefix}`);
          const [version, ...program] = res.words;
          const data2 = bech32.fromWords(program);
          validateWitness(version, data2);
          if (version === 0 && data2.length === 32)
            return { type: "wsh", hash: data2 };
          else if (version === 0 && data2.length === 20)
            return { type: "wpkh", hash: data2 };
          else if (version === 1 && data2.length === 32)
            return { type: "tr", pubkey: data2 };
          else
            throw new Error("Unknown witness program");
        }
        const data = base58check2.decode(address);
        if (data.length !== 21)
          throw new Error("Invalid base58 address");
        if (data[0] === network.pubKeyHash) {
          return { type: "pkh", hash: data.slice(1) };
        } else if (data[0] === network.scriptHash) {
          return {
            type: "sh",
            hash: data.slice(1)
          };
        }
        throw new Error(`Invalid address prefix=${data[0]}`);
      }
    };
  }

  // node_modules/@scure/btc-signer/musig2.js
  var InvalidContributionErr = class extends Error {
    // BIP327 identifiable aborts blame exactly one signer by participant index in the
    // caller's session ordering, so callers interpret idx using the same ordering they signed with.
    idx;
    // Indice of participant
    constructor(idx, m) {
      super(m);
      this.idx = idx;
    }
  };
  var taggedHash2 = /* @__PURE__ */ (() => schnorr.utils.taggedHash)();
  var pointToBytes2 = /* @__PURE__ */ (() => schnorr.utils.pointToBytes)();
  var Point3 = /* @__PURE__ */ (() => secp256k1.Point)();
  var Fn2 = /* @__PURE__ */ (() => Point3.Fn)();
  var PUBKEY_LEN = /* @__PURE__ */ (() => secp256k1.lengths.publicKey)();
  var ZERO = /* @__PURE__ */ new Uint8Array(PUBKEY_LEN);
  function abytesArray(lst, ...lengths) {
    if (!Array.isArray(lst))
      throw new TypeError("expected array");
    lst.forEach((i) => abytes(i, ...lengths));
  }
  function aXonly(lst) {
    if (!Array.isArray(lst))
      throw new TypeError("expected array");
    lst.forEach((i, j) => {
      if (typeof i !== "boolean")
        throw new TypeError("expected boolean in xOnly array, got" + i + "(" + j + ")");
    });
  }
  var taggedInt = (tag, ...messages) => Fn2.create(Fn2.fromBytes(taggedHash2(tag, ...messages), true));
  function mulBase(n) {
    return Point3.BASE.multiply(n);
  }
  function isZero(point) {
    return point.equals(Point3.ZERO);
  }
  function sortKeys(publicKeys) {
    abytesArray(publicKeys, PUBKEY_LEN);
    if (!publicKeys.length)
      throw new RangeError("sortKeys: expected non-empty signer key list");
    return Array.from(publicKeys).sort(compareBytes);
  }
  function getSecondKey(publicKeys) {
    abytesArray(publicKeys, PUBKEY_LEN);
    for (let j = 1; j < publicKeys.length; j++)
      if (!equalBytes(publicKeys[j], publicKeys[0]))
        return publicKeys[j];
    return ZERO;
  }
  function keyAggL(publicKeys) {
    abytesArray(publicKeys, PUBKEY_LEN);
    return taggedHash2("KeyAgg list", ...publicKeys);
  }
  function keyAggCoeffInternal(publicKey1, publicKey2, L) {
    abytes(publicKey1, PUBKEY_LEN);
    abytes(publicKey2, PUBKEY_LEN);
    if (equalBytes(publicKey1, publicKey2))
      return 1n;
    return taggedInt("KeyAgg coefficient", L, publicKey1);
  }
  function keyAggregate(publicKeys, tweaks = [], isXonly = []) {
    abytesArray(publicKeys, PUBKEY_LEN);
    if (publicKeys.length < 1)
      throw new RangeError("keyAggregate: expected at least 1 public key");
    abytesArray(tweaks, 32);
    aXonly(isXonly);
    if (tweaks.length !== isXonly.length)
      throw new RangeError("The tweaks and isXonly arrays must have the same length");
    const pk2 = getSecondKey(publicKeys);
    const L = keyAggL(publicKeys);
    let aggPublicKey = Point3.ZERO;
    for (let i = 0; i < publicKeys.length; i++) {
      let Pi;
      try {
        Pi = Point3.fromBytes(publicKeys[i]);
      } catch (error) {
        throw new InvalidContributionErr(i, "pubkey");
      }
      aggPublicKey = aggPublicKey.add(Pi.multiply(keyAggCoeffInternal(publicKeys[i], pk2, L)));
    }
    let gAcc = Fn2.ONE;
    let tweakAcc = Fn2.ZERO;
    for (let i = 0; i < tweaks.length; i++) {
      const g = isXonly[i] && !hasEven2(aggPublicKey.y) ? Fn2.neg(Fn2.ONE) : Fn2.ONE;
      const t = Fn2.fromBytes(tweaks[i], true);
      if (!Fn2.isValid(t))
        throw new RangeError("invalid scalar: out of range");
      aggPublicKey = aggPublicKey.multiply(g).add(Fn2.is0(t) ? Point3.ZERO : mulBase(t));
      if (isZero(aggPublicKey))
        throw new Error("The result of tweaking cannot be infinity");
      gAcc = Fn2.mul(g, gAcc);
      tweakAcc = Fn2.add(t, Fn2.mul(g, tweakAcc));
    }
    return { aggPublicKey, gAcc, tweakAcc };
  }
  function keyAggExport(ctx) {
    return pointToBytes2(ctx.aggPublicKey);
  }

  // src/browser/app.js
  var import_bech32 = __toESM(require_dist(), 1);
  var NURI_RP_ID = "nuri.com";
  var NURI_PRF_INPUT = "nuri-prf-salt-v1";
  var NURI_KDF_DOMAIN = "app:nuri.com|wallet|v1";
  var CREDENTIAL_STORAGE_KEY = "nuri-prf-recovery:credentialId";
  var USER_VERIFICATION = "required";
  var LEGACY_CSV_CANDIDATES = [
    { id: "legacy-main-external", label: "Legacy Bitcoin CSV external", csvBlocks: 52500 },
    { id: "legacy-main-internal", label: "Legacy Bitcoin CSV internal", csvBlocks: 52501 },
    { id: "legacy-debug-external", label: "Legacy Bitcoin CSV debug external", csvBlocks: 3 },
    { id: "legacy-debug-internal", label: "Legacy Bitcoin CSV debug internal", csvBlocks: 4 }
  ];
  var elements = {
    recoverButton: document.querySelector("#recoverButton"),
    importDumpButton: document.querySelector("#importDumpButton"),
    originStatus: document.querySelector("#originStatus"),
    message: document.querySelector("#message"),
    recoveryBundle: document.querySelector("#recoveryBundle"),
    metadataStatus: document.querySelector("#metadataStatus"),
    recoveryOutput: document.querySelector("#recoveryOutput"),
    utxoOutput: document.querySelector("#utxoOutput"),
    bitcoinAddress: document.querySelector("#bitcoinAddress"),
    bitcoinPrivateKey: document.querySelector("#bitcoinPrivateKey"),
    bitcoinPublicKey: document.querySelector("#bitcoinPublicKey"),
    ethereumAddress: document.querySelector("#ethereumAddress"),
    ethereumPrivateKey: document.querySelector("#ethereumPrivateKey"),
    ethereumPublicKey: document.querySelector("#ethereumPublicKey"),
    exportJson: document.querySelector("#exportJson")
  };
  function utf82(value) {
    return new TextEncoder().encode(value);
  }
  function bytesToHex3(bytes) {
    return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function stripHexPrefix(value) {
    return String(value || "").trim().toLowerCase().replace(/^0x/u, "");
  }
  function hexToBytes3(value) {
    const hex2 = stripHexPrefix(value);
    if (!/^[0-9a-f]*$/u.test(hex2) || hex2.length % 2 !== 0) {
      throw new Error("Invalid hex string.");
    }
    const out = new Uint8Array(hex2.length / 2);
    for (let index = 0; index < out.length; index += 1) {
      out[index] = Number.parseInt(hex2.slice(index * 2, index * 2 + 2), 16);
    }
    return out;
  }
  function bytesLikeToBytes(value, length) {
    if (typeof value === "string") {
      const hex2 = stripHexPrefix(value);
      if (/^[0-9a-f]+$/u.test(hex2) && hex2.length % 2 === 0) {
        const bytes = hexToBytes3(hex2);
        return length == null || bytes.length === length ? bytes : null;
      }
      return null;
    }
    if (value instanceof Uint8Array) {
      return length == null || value.length === length ? value : null;
    }
    if (Array.isArray(value)) {
      if (!value.every((entry) => Number.isInteger(Number(entry)) && Number(entry) >= 0 && Number(entry) <= 255)) {
        return null;
      }
      const bytes = new Uint8Array(value.map((entry) => Number(entry)));
      return length == null || bytes.length === length ? bytes : null;
    }
    if (value && typeof value === "object") {
      const numericKeys = Object.keys(value).filter((key) => /^\d+$/u.test(key)).map((key) => Number.parseInt(key, 10)).sort((left, right) => left - right);
      if (!numericKeys.length) return null;
      const expectedLength = numericKeys[numericKeys.length - 1] + 1;
      if (!numericKeys.every((key, index) => key === index)) return null;
      const bytes = new Uint8Array(expectedLength);
      for (const key of numericKeys) {
        const byte = Number(value[String(key)]);
        if (!Number.isInteger(byte) || byte < 0 || byte > 255) return null;
        bytes[key] = byte;
      }
      return length == null || bytes.length === length ? bytes : null;
    }
    return null;
  }
  function bytesLikeToHex(value, length) {
    const bytes = bytesLikeToBytes(value, length);
    return bytes ? bytesToHex3(bytes) : "";
  }
  function normalizeCompressedKey(value) {
    const hex2 = stripHexPrefix(value);
    return /^(02|03)[0-9a-f]{64}$/u.test(hex2) ? hex2 : "";
  }
  function normalizeXOnly(value) {
    const hex2 = stripHexPrefix(value);
    if (/^[0-9a-f]{64}$/u.test(hex2)) return hex2;
    if (/^(02|03)[0-9a-f]{64}$/u.test(hex2)) return hex2.slice(2);
    return "";
  }
  function normalizePrivateKey(value) {
    const hex2 = stripHexPrefix(value);
    if (!/^[0-9a-f]{64}$/u.test(hex2)) return "";
    const scalar = BigInt(`0x${hex2}`);
    return scalar > 0n && scalar < secp256k1.Point.Fn.ORDER ? hex2 : "";
  }
  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
  function bytesToBase64url(bytes) {
    return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
  }
  function base64urlToBytes(value) {
    const base64 = value.trim().replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  function bytesToArrayBuffer(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  function arrayBufferToBytes(value) {
    return new Uint8Array(value);
  }
  function concatBytes5(...chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
  function taggedHash3(tag, data) {
    const tagHash = sha256(utf82(tag));
    return sha256(concatBytes5(tagHash, tagHash, data));
  }
  function sequenceToTimelock(sequence) {
    const value = Math.trunc(Number(sequence));
    if (!Number.isInteger(value) || value < 0) return null;
    if (value & 1 << 31) return null;
    const masked = value & 65535;
    if (value & 1 << 22) {
      return { type: "seconds", value: masked << 9, sequence: value };
    }
    return { type: "blocks", value: masked, sequence: value };
  }
  function csvStatus(utxo, csv, tipHeight) {
    const status = utxo?.status || {};
    if (!status.confirmed) {
      return {
        state: "unconfirmed",
        movableAlone: false,
        detail: "unconfirmed, CSV timer has not started"
      };
    }
    if (!csv || !csv.type || !Number.isFinite(Number(csv.value))) {
      return {
        state: "unknown",
        movableAlone: false,
        detail: "CSV policy unavailable"
      };
    }
    const value = Math.max(0, Math.trunc(Number(csv.value)));
    if (csv.type === "blocks") {
      const blockHeight = Number(status.block_height);
      if (!Number.isFinite(blockHeight) || !Number.isFinite(Number(tipHeight))) {
        return {
          state: "unknown",
          movableAlone: false,
          detail: `confirmed, needs ${value} blocks from confirmation height`
        };
      }
      const unlockHeight = blockHeight + value;
      const remaining = Math.max(0, unlockHeight - Number(tipHeight));
      return {
        state: remaining === 0 ? "ready" : "locked",
        movableAlone: remaining === 0,
        unlockHeight,
        blocksRemaining: remaining,
        approxTime: remaining === 0 ? "now" : formatDurationSeconds(remaining * 600),
        detail: remaining === 0 ? "client-only CSV path is spendable now" : `${remaining} blocks remaining, about ${formatDurationSeconds(remaining * 600)}`
      };
    }
    const blockTime = Number(status.block_time);
    if (!Number.isFinite(blockTime)) {
      return {
        state: "unknown",
        movableAlone: false,
        detail: `confirmed, needs about ${formatDurationSeconds(value)} by BIP68 time CSV`
      };
    }
    const unlockTime = blockTime + value;
    const remainingSeconds = Math.max(0, unlockTime - Math.floor(Date.now() / 1e3));
    return {
      state: remainingSeconds === 0 ? "ready" : "locked",
      movableAlone: remainingSeconds === 0,
      unlockTime,
      secondsRemaining: remainingSeconds,
      approxBlocksRemaining: Math.ceil(remainingSeconds / 600),
      approxTime: remainingSeconds === 0 ? "now" : formatDurationSeconds(remainingSeconds),
      detail: remainingSeconds === 0 ? "client-only CSV path is spendable now" : `${formatDurationSeconds(remainingSeconds)} remaining, about ${Math.ceil(remainingSeconds / 600)} blocks`
    };
  }
  function formatDurationSeconds(seconds) {
    const total = Math.max(0, Math.ceil(Number(seconds) || 0));
    if (total < 60) return `${total}s`;
    const minutes = Math.ceil(total / 60);
    if (minutes < 120) return `${minutes}m`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 72) return `${hours}h`;
    const days = Math.ceil(hours / 24);
    return `${days}d`;
  }
  function bytesToNumberBE2(bytes) {
    return BigInt(`0x${bytesToHex3(bytes)}`);
  }
  function base58Encode(bytes) {
    const alphabet2 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let value = bytesToNumberBE2(bytes);
    let output = "";
    while (value > 0n) {
      const mod2 = value % 58n;
      output = alphabet2[Number(mod2)] + output;
      value /= 58n;
    }
    for (const byte of bytes) {
      if (byte !== 0) break;
      output = `1${output}`;
    }
    return output || "1";
  }
  function base58CheckEncode(payload) {
    const checksum2 = sha256(sha256(payload)).slice(0, 4);
    return base58Encode(concatBytes5(payload, checksum2));
  }
  function privateKeyToWif(privateKey) {
    return base58CheckEncode(concatBytes5(new Uint8Array([128]), privateKey, new Uint8Array([1])));
  }
  function aggregateMuSig2Keys(clientPk33, serverPk33) {
    const client = hexToBytes3(clientPk33);
    const server = hexToBytes3(serverPk33);
    const aggregate = keyAggregate(sortKeys([client, server]));
    const exported = keyAggExport(aggregate);
    const compressed = exported.length === 33 ? exported : aggregate?.aggPublicKey?.toBytes ? aggregate.aggPublicKey.toBytes(true) : null;
    if (!(compressed instanceof Uint8Array) || compressed.length !== 33) {
      throw new Error("Failed to aggregate MuSig2 public keys.");
    }
    const xOnly = exported.length === 32 ? exported : compressed.slice(1);
    if (xOnly.length !== 32) {
      throw new Error("Failed to export MuSig2 x-only key.");
    }
    return {
      compressedHex: bytesToHex3(compressed),
      xOnlyHex: bytesToHex3(xOnly)
    };
  }
  function buildLegacyCsvLeaf(userXOnly, csvBlocks) {
    return {
      script: Script.encode([
        userXOnly,
        "CHECKSIGVERIFY",
        csvBlocks,
        "CHECKSEQUENCEVERIFY"
      ]),
      leafVersion: 192
    };
  }
  function buildLegacyCsvCandidate({ id, label, clientPk33, serverPk33, csvBlocks }) {
    const aggregated = aggregateMuSig2Keys(clientPk33, serverPk33);
    const clientXOnly = hexToBytes3(clientPk33.slice(2));
    const internalKey = hexToBytes3(aggregated.xOnlyHex);
    const leaf = buildLegacyCsvLeaf(clientXOnly, csvBlocks);
    const p2tr2 = p2tr(internalKey, [leaf], NETWORK, true);
    const tweakedPubkey = p2tr2.tweakedPubkey instanceof Uint8Array ? p2tr2.tweakedPubkey : null;
    const scriptPubKey = p2tr2.script instanceof Uint8Array ? p2tr2.script : null;
    return {
      id,
      label,
      type: "legacy-bitcoin-csv",
      network: "bitcoin-mainnet",
      address: p2tr2.address || "",
      descriptor: `tr(${aggregated.xOnlyHex},and_v(v:pk(${bytesToHex3(clientXOnly)}),older(${csvBlocks})))`,
      scriptPubKeyHex: scriptPubKey ? bytesToHex3(scriptPubKey) : "",
      csv: {
        type: "blocks",
        value: csvBlocks,
        sequence: csvBlocks
      },
      clientPk33,
      serverPk33,
      aggregatedPk33: aggregated.compressedHex,
      aggregatedXonly32: aggregated.xOnlyHex,
      clientXonly32: bytesToHex3(clientXOnly),
      tapInternalKeyHex: aggregated.xOnlyHex,
      tapMerkleRootHex: p2tr2.tapMerkleRoot ? bytesToHex3(p2tr2.tapMerkleRoot) : "",
      tweakedPubkeyHex: tweakedPubkey ? bytesToHex3(tweakedPubkey) : "",
      tapLeafScriptPresent: Array.isArray(p2tr2.tapLeafScript) && p2tr2.tapLeafScript.length > 0
    };
  }
  function descriptorWithoutChecksum(descriptor) {
    return String(descriptor || "").trim().replace(/#[a-z0-9]+$/iu, "");
  }
  function parseTaprootCsvDescriptor(descriptor) {
    const text = descriptorWithoutChecksum(descriptor);
    const internalMatch = text.match(/^tr\(\s*([^,\s]+)\s*,/iu);
    const pkMatch = text.match(/pk\(\s*((?:02|03)?[0-9a-f]{64})\s*\)/iu);
    const csvMatch = text.match(/older\(\s*(\d+)\s*\)/iu);
    const internalXonly32 = normalizeXOnly(internalMatch?.[1] || "");
    const userXonly32 = normalizeXOnly(pkMatch?.[1] || "");
    const csvBlocks = csvMatch ? Number.parseInt(csvMatch[1], 10) : NaN;
    if (!internalXonly32 || !userXonly32 || !Number.isInteger(csvBlocks) || csvBlocks <= 0) {
      throw new Error("Unsupported descriptor. Expected tr(<xonly>,and_v(v:pk(<xonly>),older(<blocks>))).");
    }
    return {
      descriptor: text,
      internalXonly32,
      userXonly32,
      csvBlocks
    };
  }
  function buildTaprootCsvCandidate({ id, label, descriptor, internalXonly32, userXonly32, csvBlocks, source }) {
    const internalKey = hexToBytes3(internalXonly32);
    const userXOnly = hexToBytes3(userXonly32);
    const leaf = buildLegacyCsvLeaf(userXOnly, csvBlocks);
    const p2tr2 = p2tr(internalKey, [leaf], NETWORK, true);
    const tweakedPubkey = p2tr2.tweakedPubkey instanceof Uint8Array ? p2tr2.tweakedPubkey : null;
    const scriptPubKey = p2tr2.script instanceof Uint8Array ? p2tr2.script : null;
    return {
      id,
      label,
      source,
      type: "dump-taproot-csv",
      network: "bitcoin-mainnet",
      address: p2tr2.address || "",
      descriptor: descriptor || `tr(${internalXonly32},and_v(v:pk(${userXonly32}),older(${csvBlocks})))`,
      scriptPubKeyHex: scriptPubKey ? bytesToHex3(scriptPubKey) : "",
      csv: {
        type: "blocks",
        value: csvBlocks,
        sequence: csvBlocks
      },
      clientXonly32: userXonly32,
      tapInternalKeyHex: internalXonly32,
      tapMerkleRootHex: p2tr2.tapMerkleRoot ? bytesToHex3(p2tr2.tapMerkleRoot) : "",
      tweakedPubkeyHex: tweakedPubkey ? bytesToHex3(tweakedPubkey) : "",
      tapLeafScriptPresent: Array.isArray(p2tr2.tapLeafScript) && p2tr2.tapLeafScript.length > 0
    };
  }
  function satsToBtc(sats) {
    const value = BigInt(Math.trunc(Number(sats) || 0));
    const whole = value / 100000000n;
    const fraction = String(value % 100000000n).padStart(8, "0");
    return `${whole}.${fraction} BTC`;
  }
  function toChecksumAddress(addressBytes) {
    const lower = bytesToHex3(addressBytes);
    const hash = bytesToHex3(keccak_256(utf82(lower)));
    let out = "0x";
    for (let index = 0; index < lower.length; index += 1) {
      const char = lower[index];
      out += /[a-f]/u.test(char) && Number.parseInt(hash[index], 16) >= 8 ? char.toUpperCase() : char;
    }
    return out;
  }
  function deriveWalletEntropy(prfBytes, chain2) {
    const salt = sha256(utf82(NURI_KDF_DOMAIN));
    const info = chain2 === "bitcoin" ? "app:nuri.com|wallet|v1|chain=bitcoin|fmt=taproot" : "app:nuri.com|wallet|v1|chain=ethereum|fmt=secp256k1";
    return hkdf(sha256, prfBytes, salt, utf82(info), 32);
  }
  function deriveBitcoinKeypair(prfBytes) {
    const entropy = deriveWalletEntropy(prfBytes, "bitcoin");
    const child = HDKey.fromMasterSeed(entropy).derive("m/86'/0'/0'/0/0");
    if (!child.privateKey || !child.publicKey) {
      throw new Error("Failed to derive Bitcoin keypair.");
    }
    const privateKey = new Uint8Array(child.privateKey);
    const publicKeyCompressed = new Uint8Array(child.publicKey);
    const internalXOnly = publicKeyCompressed.slice(1);
    const tweak = taggedHash3("TapTweak", internalXOnly);
    const tweakScalar = bytesToNumberBE2(tweak) % secp256k1.Point.Fn.ORDER;
    const internalPoint = secp256k1.Point.fromHex(bytesToHex3(publicKeyCompressed));
    const tweakedPoint = internalPoint.add(secp256k1.Point.BASE.multiply(tweakScalar));
    const taprootOutputKey = tweakedPoint.toBytes(true).slice(1);
    const address = import_bech32.bech32m.encode("bc", [1, ...import_bech32.bech32m.toWords(taprootOutputKey)]);
    return {
      network: "bitcoin-mainnet",
      type: "bip86-taproot",
      derivationPath: "m/86'/0'/0'/0/0",
      address,
      privateKeyHex: `0x${bytesToHex3(privateKey)}`,
      privateKeyWif: privateKeyToWif(privateKey),
      publicKeyCompressedHex: `0x${bytesToHex3(publicKeyCompressed)}`,
      internalXOnlyPublicKeyHex: `0x${bytesToHex3(internalXOnly)}`,
      taprootOutputKeyHex: `0x${bytesToHex3(taprootOutputKey)}`
    };
  }
  function deriveEthereumKeypair(prfBytes) {
    const entropy = deriveWalletEntropy(prfBytes, "ethereum");
    const child = HDKey.fromMasterSeed(entropy).derive("m/44'/60'/0'/0/0");
    if (!child.privateKey) {
      throw new Error("Failed to derive Ethereum keypair.");
    }
    const privateKey = new Uint8Array(child.privateKey);
    const point = secp256k1.Point.BASE.multiply(bytesToNumberBE2(privateKey));
    const publicKeyUncompressed = point.toBytes(false);
    const addressBytes = keccak_256(publicKeyUncompressed.slice(1)).slice(-20);
    return {
      network: "ethereum",
      type: "secp256k1",
      derivationPath: "m/44'/60'/0'/0/0",
      address: toChecksumAddress(addressBytes),
      privateKeyHex: `0x${bytesToHex3(privateKey)}`,
      publicKeyUncompressedHex: `0x${bytesToHex3(publicKeyUncompressed)}`,
      publicKeyCompressedHex: `0x${bytesToHex3(point.toBytes(true))}`
    };
  }
  function setMessage(text, kind = "neutral") {
    elements.message.className = `message ${kind}`;
    elements.message.textContent = text;
  }
  function setOriginStatus(text, kind = "neutral") {
    elements.originStatus.className = `status ${kind}`;
    elements.originStatus.textContent = text;
  }
  function clearOutputs() {
    elements.metadataStatus.textContent = "No server lookup yet.";
    elements.recoveryOutput.value = "";
    elements.utxoOutput.value = "";
    elements.bitcoinAddress.value = "";
    elements.bitcoinPrivateKey.value = "";
    elements.bitcoinPublicKey.value = "";
    elements.ethereumAddress.value = "";
    elements.ethereumPrivateKey.value = "";
    elements.ethereumPublicKey.value = "";
    elements.exportJson.value = "";
  }
  function prfEvalInput() {
    return {
      first: bytesToArrayBuffer(utf82(NURI_PRF_INPUT))
    };
  }
  function challenge2() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytesToArrayBuffer(bytes);
  }
  function basePublicKeyOptions() {
    return {
      challenge: challenge2(),
      rpId: NURI_RP_ID,
      timeout: 12e4,
      userVerification: USER_VERIFICATION
    };
  }
  function prfByCredentialOptions(credentialBytes) {
    return {
      ...basePublicKeyOptions(),
      allowCredentials: [
        {
          type: "public-key",
          id: bytesToArrayBuffer(credentialBytes)
        }
      ],
      extensions: {
        prf: {
          evalByCredential: {
            [bytesToBase64url(credentialBytes)]: prfEvalInput()
          }
        }
      }
    };
  }
  function directPrfOptions() {
    return {
      ...basePublicKeyOptions(),
      extensions: {
        prf: {
          eval: prfEvalInput()
        }
      }
    };
  }
  async function credentialsGet(publicKey) {
    const credential = await navigator.credentials.get({ publicKey });
    if (!credential) {
      throw new Error("No passkey credential was returned.");
    }
    return credential;
  }
  function extractPrf(credential) {
    const extensions = credential.getClientExtensionResults();
    const result = extensions?.prf?.results?.first;
    return result ? arrayBufferToBytes(result) : null;
  }
  async function recoverPrf() {
    const cachedCredentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (cachedCredentialId) {
      try {
        setMessage("Waiting for passkey verification...", "neutral");
        const credential2 = await credentialsGet(prfByCredentialOptions(base64urlToBytes(cachedCredentialId)));
        const prf2 = extractPrf(credential2);
        if (prf2) return { credential: credential2, prf: prf2, mode: "cached-credential" };
      } catch (error) {
        localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
        console.warn("Cached credential PRF failed; falling back to discovery.", error);
      }
    }
    try {
      setMessage("Waiting for passkey verification...", "neutral");
      const credential2 = await credentialsGet(directPrfOptions());
      const credentialBytes2 = arrayBufferToBytes(credential2.rawId);
      localStorage.setItem(CREDENTIAL_STORAGE_KEY, bytesToBase64url(credentialBytes2));
      const prf2 = extractPrf(credential2);
      if (prf2) return { credential: credential2, prf: prf2, mode: "direct-prf" };
      setMessage("Passkey selected. Waiting for PRF verification...", "neutral");
      const secondCredential = await credentialsGet(prfByCredentialOptions(credentialBytes2));
      const secondPrf = extractPrf(secondCredential);
      if (secondPrf) return { credential: secondCredential, prf: secondPrf, mode: "discover-then-prf" };
    } catch (error) {
      console.warn("Direct PRF failed; falling back to credential discovery.", error);
    }
    setMessage("Select the Nuri passkey...", "neutral");
    const discoveredCredential = await credentialsGet(basePublicKeyOptions());
    const credentialBytes = arrayBufferToBytes(discoveredCredential.rawId);
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, bytesToBase64url(credentialBytes));
    setMessage("Passkey selected. Waiting for PRF verification...", "neutral");
    const credential = await credentialsGet(prfByCredentialOptions(credentialBytes));
    const prf = extractPrf(credential);
    if (!prf) {
      throw new Error("No PRF result was returned. The selected passkey or browser may not support WebAuthn PRF for this credential.");
    }
    return { credential, prf, mode: "discover-then-prf" };
  }
  async function postJson(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
    return data;
  }
  function findFirstDeep(value, predicate, seen = /* @__PURE__ */ new WeakSet()) {
    if (!value || typeof value !== "object") return null;
    if (seen.has(value)) return null;
    seen.add(value);
    if (predicate(value)) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findFirstDeep(item, predicate, seen);
        if (found) return found;
      }
      return null;
    }
    for (const item of Object.values(value)) {
      const found = findFirstDeep(item, predicate, seen);
      if (found) return found;
    }
    return null;
  }
  function findStringByKeys(value, keys, seen = /* @__PURE__ */ new WeakSet()) {
    if (!value || typeof value !== "object") return "";
    if (seen.has(value)) return "";
    seen.add(value);
    if (!Array.isArray(value)) {
      for (const key of keys) {
        if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
      }
    }
    const children = Array.isArray(value) ? value : Object.values(value);
    for (const child of children) {
      const found = findStringByKeys(child, keys, seen);
      if (found) return found;
    }
    return "";
  }
  function collectOutpoints(value, path = "$", out = [], seen = /* @__PURE__ */ new WeakSet()) {
    if (!value || typeof value !== "object" || out.length >= 200) return out;
    if (seen.has(value)) return out;
    seen.add(value);
    if (!Array.isArray(value)) {
      const txid = typeof value.txid === "string" ? value.txid : typeof value.txId === "string" ? value.txId : "";
      const rawVout = value.vout ?? value.outputIndex ?? value.n;
      const valueSats = value.value ?? value.amount ?? value.sats;
      if (/^[0-9a-f]{64}$/iu.test(txid) && Number.isFinite(Number(rawVout))) {
        out.push({
          sourcePath: path,
          txid,
          vout: Math.trunc(Number(rawVout)),
          value: Number.isFinite(Number(valueSats)) ? Math.trunc(Number(valueSats)) : null,
          status: value.status || null,
          csvStatus: value.csvStatus || null,
          csvSequence: Number.isFinite(Number(value.csvSequence)) ? Math.trunc(Number(value.csvSequence)) : null
        });
      }
    }
    const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
    for (const [key, child] of entries) {
      collectOutpoints(child, `${path}.${String(key)}`, out, seen);
    }
    return out;
  }
  function collectDescriptorEntries(raw) {
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const add2 = (id, label, value) => {
      if (typeof value !== "string" || !value.trim()) return;
      const descriptor = descriptorWithoutChecksum(value);
      if (!descriptor.startsWith("tr(") || seen.has(descriptor)) return;
      seen.add(descriptor);
      entries.push({ id, label, descriptor });
    };
    const walletDescriptors = raw?.wallet?.descriptors;
    if (walletDescriptors && typeof walletDescriptors === "object") {
      add2("wallet-external", "Dump wallet external descriptor", walletDescriptors.external);
      add2("wallet-internal", "Dump wallet internal descriptor", walletDescriptors.internal);
      for (const [key, value] of Object.entries(walletDescriptors)) {
        if (key !== "external" && key !== "internal") add2(`wallet-${key}`, `Dump wallet ${key} descriptor`, value);
      }
    }
    const rootDescriptors = raw?.descriptors;
    if (rootDescriptors && typeof rootDescriptors === "object") {
      add2("root-external", "Dump external descriptor", rootDescriptors.external);
      add2("root-internal", "Dump internal descriptor", rootDescriptors.internal);
    }
    add2("root-descriptor", "Dump descriptor", raw?.descriptor);
    add2("wallet-descriptor", "Dump wallet descriptor", raw?.wallet?.descriptor);
    return entries;
  }
  function parseRecoveryBundle() {
    const text = elements.recoveryBundle.value.trim();
    if (!text) {
      return {
        present: false,
        error: "",
        raw: null,
        serverPk33: "",
        aggregatedXonly32: "",
        nuriServerCsv: null,
        legacyCsvBlocks: [],
        descriptorEntries: [],
        outpoints: []
      };
    }
    try {
      const raw = JSON.parse(text);
      const serverPk33 = normalizeCompressedKey(
        findStringByKeys(raw, [
          "serverPk33",
          "server_pubkey",
          "server_signer_pubkey",
          "serverSignerPubkeyHex",
          "cosignerCompressed"
        ])
      );
      const aggregatedXonly32 = normalizeXOnly(
        findStringByKeys(raw, ["aggregatedXonly32", "aggregatedExternal", "tapInternalKeyHex"])
      );
      const csvObject = findFirstDeep(raw, (entry) => {
        const type = String(entry?.type || "").toLowerCase();
        return (type === "blocks" || type === "seconds") && Number.isFinite(Number(entry?.value));
      });
      const descriptors = raw?.wallet?.descriptors || raw?.descriptors || {};
      const descriptorEntries = collectDescriptorEntries(raw);
      const descriptorTexts = [descriptors.external, descriptors.internal, raw?.descriptor].filter((value) => typeof value === "string").join("\n");
      const legacyCsvBlocks = [...descriptorTexts.matchAll(/older\((\d+)\)/gu)].map((match2) => Number.parseInt(match2[1], 10)).filter((value) => Number.isInteger(value) && value > 0);
      return {
        present: true,
        error: "",
        raw,
        serverPk33,
        aggregatedXonly32,
        nuriServerCsv: csvObject ? { type: String(csvObject.type).toLowerCase(), value: Math.trunc(Number(csvObject.value)) } : null,
        legacyCsvBlocks: [...new Set(legacyCsvBlocks)],
        descriptorEntries,
        outpoints: collectOutpoints(raw)
      };
    } catch (error) {
      return {
        present: true,
        error: error.message || String(error),
        raw: null,
        serverPk33: "",
        aggregatedXonly32: "",
        nuriServerCsv: null,
        legacyCsvBlocks: [],
        descriptorEntries: [],
        outpoints: []
      };
    }
  }
  function collectServerKeys(metadata, manual) {
    const keys = [];
    const add2 = (source, value, kind = "legacy") => {
      const serverPk33 = normalizeCompressedKey(value);
      if (!serverPk33) return;
      if (keys.some((entry) => entry.serverPk33 === serverPk33 && entry.kind === kind)) return;
      keys.push({ source, kind, serverPk33 });
    };
    if (manual.serverPk33) add2("pasted recovery bundle", manual.serverPk33, "manual");
    for (const attempt of metadata?.attempts || []) {
      if (!attempt.ok) continue;
      const data = attempt.data || {};
      if (attempt.source === "arkade-v4-info") {
        add2(attempt.source, data.server_pubkey || data.cosigner_derivation?.server_pubkey, "arkade-v4");
        continue;
      }
      add2(attempt.source, data.server_pubkey || data.server_signer_pubkey, "legacy");
    }
    return keys;
  }
  function buildRecoveryCandidates({ clientPk33, serverKeys, manual }) {
    const candidates = [];
    const legacyCsvValues = new Set(LEGACY_CSV_CANDIDATES.map((entry) => entry.csvBlocks));
    for (const csvBlocks of manual.legacyCsvBlocks || []) legacyCsvValues.add(csvBlocks);
    for (const serverKey of serverKeys) {
      if (serverKey.kind === "arkade-v4") continue;
      for (const csvBlocks of legacyCsvValues) {
        const base = LEGACY_CSV_CANDIDATES.find((entry) => entry.csvBlocks === csvBlocks);
        try {
          candidates.push(
            buildLegacyCsvCandidate({
              id: `${serverKey.source}:${csvBlocks}`.replace(/[^a-z0-9:._-]/giu, "_"),
              label: base ? `${base.label} (${serverKey.source})` : `Legacy Bitcoin CSV ${csvBlocks} blocks (${serverKey.source})`,
              clientPk33,
              serverPk33: serverKey.serverPk33,
              csvBlocks
            })
          );
        } catch (error) {
          console.warn("Failed to build legacy CSV candidate", serverKey.source, csvBlocks, error);
        }
      }
    }
    return candidates;
  }
  function buildDumpCandidates(manual) {
    if (!manual?.raw || manual.error) return [];
    const candidates = [];
    for (const entry of manual.descriptorEntries || []) {
      try {
        const parsed = parseTaprootCsvDescriptor(entry.descriptor);
        candidates.push(
          buildTaprootCsvCandidate({
            id: `dump-${entry.id}`.replace(/[^a-z0-9._-]/giu, "_"),
            label: entry.label,
            source: "pasted-descriptor",
            ...parsed
          })
        );
      } catch (error) {
        console.warn("Failed to parse dump descriptor", entry.id, error);
      }
    }
    const recoveryData = manual.raw.recoveryData || manual.raw.recovery || manual.raw.csvRecoveryData || null;
    if (recoveryData && typeof recoveryData === "object") {
      const internalXonly32 = bytesLikeToHex(recoveryData.tapInternalKey, 32) || bytesLikeToHex(recoveryData.internalKey, 32) || normalizeXOnly(recoveryData.tapInternalKeyHex || recoveryData.internalKeyHex || "");
      const userXonly32 = bytesLikeToHex(recoveryData.userXOnly, 32) || bytesLikeToHex(recoveryData.userXonly, 32) || normalizeXOnly(recoveryData.userXOnlyHex || recoveryData.userXonlyHex || "");
      const csvBlocks = Math.trunc(
        Number(recoveryData.csvBlocks || manual.raw.wallet?.info?.csvBlocks || manual.legacyCsvBlocks?.[0] || 0)
      );
      if (internalXonly32 && userXonly32 && Number.isInteger(csvBlocks) && csvBlocks > 0) {
        try {
          candidates.push(
            buildTaprootCsvCandidate({
              id: "dump-recovery-data",
              label: "Dump recoveryData Taproot CSV",
              source: "pasted-recovery-data",
              internalXonly32,
              userXonly32,
              csvBlocks
            })
          );
        } catch (error) {
          console.warn("Failed to build dump recoveryData candidate", error);
        }
      }
    }
    return dedupeCandidates(candidates);
  }
  function dedupeCandidates(candidates) {
    const byKey = /* @__PURE__ */ new Map();
    for (const candidate of candidates) {
      if (!candidate?.address) continue;
      const key = `${candidate.address}|${candidate.csv?.type || ""}|${candidate.csv?.value || ""}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          ...candidate,
          labels: [candidate.label].filter(Boolean),
          sources: [candidate.source || candidate.type].filter(Boolean)
        });
        continue;
      }
      if (candidate.label && !existing.labels.includes(candidate.label)) existing.labels.push(candidate.label);
      if (candidate.source && !existing.sources.includes(candidate.source)) existing.sources.push(candidate.source);
      existing.label = existing.labels.join(" / ");
    }
    return [...byKey.values()];
  }
  async function lookupRecoveryMetadata({ credentialId, clientPk33 }) {
    try {
      return await postJson("/api/recovery-metadata", { credentialId, clientPk33 });
    } catch (error) {
      return {
        ok: false,
        attempts: [],
        error: error.message || String(error)
      };
    }
  }
  async function lookupUtxos(candidates) {
    const addresses = candidates.filter((candidate) => candidate.address).map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      address: candidate.address,
      csv: candidate.csv
    }));
    if (!addresses.length) return { ok: true, tipHeight: null, results: [] };
    return postJson("/api/utxos", { addresses });
  }
  function formatMetadataStatus(metadata, serverKeys) {
    if (!metadata.ok) return `Server lookup failed: ${metadata.error || "unknown error"}`;
    const ok = (metadata.attempts || []).filter((attempt) => attempt.ok);
    const failed = (metadata.attempts || []).filter((attempt) => !attempt.ok);
    return [
      `${ok.length} server lookup(s) succeeded, ${failed.length} failed.`,
      `Recovered public server key entries: ${serverKeys.length}.`
    ].join(" ");
  }
  function formatUtxoReport(utxoLookup, pastedOutpoints) {
    const lines = [];
    let totalSats = 0;
    let readySats = 0;
    let lockedSats = 0;
    let unconfirmedSats = 0;
    let unknownSats = 0;
    for (const result of utxoLookup?.results || []) {
      if (!result.ok) continue;
      for (const utxo of result.utxos || []) {
        const value = Math.max(0, Math.trunc(Number(utxo.value) || 0));
        const status = csvStatus(utxo, result.csv, utxoLookup.tipHeight);
        totalSats += value;
        if (status.state === "ready") readySats += value;
        else if (status.state === "locked") lockedSats += value;
        else if (status.state === "unconfirmed") unconfirmedSats += value;
        else unknownSats += value;
      }
    }
    if (utxoLookup?.ok === false && utxoLookup.error) lines.push(`UTXO lookup failed: ${utxoLookup.error}`);
    if (utxoLookup?.tipHeight != null) lines.push(`Bitcoin tip height: ${utxoLookup.tipHeight}`);
    if (utxoLookup?.results?.length) {
      lines.push(`Total UTXO value: ${totalSats} sats (${satsToBtc(totalSats)})`);
      lines.push(`Movable by client CSV now: ${readySats} sats (${satsToBtc(readySats)})`);
      lines.push(`Still CSV locked: ${lockedSats} sats (${satsToBtc(lockedSats)})`);
      if (unconfirmedSats) lines.push(`Unconfirmed: ${unconfirmedSats} sats (${satsToBtc(unconfirmedSats)})`);
      if (unknownSats) lines.push(`Unknown CSV status: ${unknownSats} sats (${satsToBtc(unknownSats)})`);
    }
    for (const result of utxoLookup?.results || []) {
      lines.push("");
      lines.push(`${result.label}`);
      lines.push(`  address: ${result.address}`);
      if (!result.ok) {
        lines.push(`  lookup failed: ${result.error}`);
        continue;
      }
      if (!result.utxos.length) {
        lines.push("  no UTXOs found");
        continue;
      }
      for (const utxo of result.utxos) {
        const status = csvStatus(utxo, result.csv, utxoLookup.tipHeight);
        const block = utxo.status?.block_height ? ` confirmed_height=${utxo.status.block_height}` : "";
        const unlock = status.unlockHeight ? ` unlock_height=${status.unlockHeight}` : "";
        lines.push(
          `  ${utxo.txid}:${utxo.vout} value=${utxo.value} sats confirmed=${utxo.status?.confirmed ? 1 : 0} move_alone=${status.movableAlone ? 1 : 0}${block}${unlock} ${status.detail}`
        );
      }
    }
    if (pastedOutpoints.length) {
      lines.push("");
      lines.push(`Pasted bundle outpoints: ${pastedOutpoints.length}`);
      for (const outpoint of pastedOutpoints.slice(0, 80)) {
        const csv = outpoint.csvSequence ? sequenceToTimelock(outpoint.csvSequence) : null;
        const status = csv ? csvStatus(outpoint, csv, null) : null;
        lines.push(
          `  ${outpoint.txid}:${outpoint.vout} value=${outpoint.value ?? "n/a"} sats source=${outpoint.sourcePath}` + (status ? ` move_alone=${status.movableAlone ? 1 : 0} ${status.detail}` : "")
        );
      }
    }
    if (!lines.length) {
      return "No UTXO scan ran. Live legacy CSV addresses require a server pubkey; Arkade v4 VTXOs require a pasted recovery bundle/storage export.";
    }
    return lines.join("\n");
  }
  function missingRecoveryMaterial({ metadata, manual, serverKeys, candidates }) {
    const missing = [];
    const hasLegacyKey = serverKeys.some((entry) => entry.kind === "legacy" || entry.kind === "manual");
    const hasArkade = serverKeys.some((entry) => entry.kind === "arkade-v4");
    const hasDumpCandidate = candidates.some((entry) => entry.type === "dump-taproot-csv");
    if (!hasLegacyKey && !hasDumpCandidate) {
      missing.push("legacy server/cosigner compressed pubkey for old Bitcoin CSV descriptors");
    }
    if (hasArkade && !manual.present) {
      missing.push("Arkade v4 recovery backup/storage paste to enumerate VTXOs and TapTrees");
    }
    if (!hasArkade && !hasLegacyKey && !metadata.ok) {
      missing.push("server lookup response or pasted recovery bundle");
    }
    if (!candidates.length) {
      missing.push("scanable legacy CSV address candidate");
    }
    return missing;
  }
  async function buildRecoveryContext({ bitcoin, credentialId }) {
    const clientPk33 = stripHexPrefix(bitcoin.publicKeyCompressedHex);
    const manual = parseRecoveryBundle();
    const metadata = await lookupRecoveryMetadata({ credentialId, clientPk33 });
    const serverKeys = collectServerKeys(metadata, manual);
    const serverCandidates = buildRecoveryCandidates({ clientPk33, serverKeys, manual });
    const dumpCandidates = buildDumpCandidates(manual);
    const candidates = dedupeCandidates([...serverCandidates, ...dumpCandidates]);
    const utxoLookup = await lookupUtxos(candidates).catch((error) => ({
      ok: false,
      error: error.message || String(error),
      tipHeight: null,
      results: []
    }));
    const missing = missingRecoveryMaterial({ metadata, manual, serverKeys, candidates });
    return {
      metadata,
      manual: {
        present: manual.present,
        error: manual.error,
        serverPk33: manual.serverPk33 || "",
        aggregatedXonly32: manual.aggregatedXonly32 || "",
        nuriServerCsv: manual.nuriServerCsv,
        legacyCsvBlocks: manual.legacyCsvBlocks,
        descriptorCount: manual.descriptorEntries.length,
        outpointCount: manual.outpoints.length
      },
      serverKeys,
      legacyCsvCandidates: candidates,
      dumpCsvCandidates: dumpCandidates,
      utxoLookup,
      pastedOutpoints: manual.outpoints,
      missing,
      statusText: formatMetadataStatus(metadata, serverKeys),
      utxoText: formatUtxoReport(utxoLookup, manual.outpoints)
    };
  }
  function importedBitcoinKey(raw, candidates) {
    const privateKeyHex = normalizePrivateKey(
      raw?.keys?.bitcoinPrivateKeyHex || raw?.keys?.bitcoin?.privateKeyHex || raw?.bitcoin?.privateKeyHex || findStringByKeys(raw, ["bitcoinPrivateKeyHex"])
    );
    if (!privateKeyHex) return null;
    const privateKey = hexToBytes3(privateKeyHex);
    const point = secp256k1.Point.BASE.multiply(bytesToNumberBE2(privateKey));
    const compressedHex = bytesToHex3(point.toBytes(true));
    const userXonly32 = compressedHex.slice(2);
    return {
      privateKeyHex: `0x${privateKeyHex}`,
      privateKeyWif: privateKeyToWif(privateKey),
      publicKeyCompressedHex: `0x${compressedHex}`,
      userXonly32: `0x${userXonly32}`,
      matchesCsvUserKey: candidates.some((candidate) => candidate.clientXonly32 === userXonly32)
    };
  }
  function formatCandidateAddresses(candidates) {
    if (!candidates.length) return "";
    return candidates.map((candidate) => `${candidate.label}
${candidate.address}
CSV: ${candidate.csv.value} blocks`).join("\n\n");
  }
  async function buildDumpImportContext() {
    const manual = parseRecoveryBundle();
    if (!manual.present) {
      throw new Error("Paste a Nuri recovery dump first.");
    }
    if (manual.error) {
      throw new Error(`Dump JSON could not be parsed: ${manual.error}`);
    }
    const candidates = buildDumpCandidates(manual);
    if (!candidates.length && !manual.outpoints.length) {
      throw new Error("The dump did not contain a supported Taproot CSV descriptor or recoveryData object.");
    }
    const utxoLookup = await lookupUtxos(candidates).catch((error) => ({
      ok: false,
      error: error.message || String(error),
      tipHeight: null,
      results: []
    }));
    const bitcoinKey = importedBitcoinKey(manual.raw, candidates);
    const missing = [];
    if (!bitcoinKey) missing.push("bitcoin private key missing; this import is watch-only");
    if (!candidates.length) missing.push("scanable Taproot CSV descriptor/address missing");
    return {
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      recoveryMode: "import-dump",
      dump: {
        version: manual.raw.version ?? null,
        createdAt: manual.raw.createdAt ?? null,
        network: manual.raw.network || manual.raw.wallet?.info?.network || "unknown"
      },
      bitcoinKey,
      manual: {
        present: true,
        descriptorCount: manual.descriptorEntries.length,
        legacyCsvBlocks: manual.legacyCsvBlocks,
        outpointCount: manual.outpoints.length
      },
      csvCandidates: candidates,
      utxoLookup,
      pastedOutpoints: manual.outpoints,
      missing,
      utxoText: formatUtxoReport(utxoLookup, manual.outpoints)
    };
  }
  function renderDumpImportOutputs(imported) {
    const totalUtxos = (imported.utxoLookup.results || []).reduce(
      (sum, result) => sum + (result.ok ? result.utxos.length : 0),
      0
    );
    elements.metadataStatus.textContent = `${imported.csvCandidates.length} CSV address candidate(s) imported from dump. ${totalUtxos} UTXO(s) found.`;
    elements.recoveryOutput.value = JSON.stringify(
      {
        dump: imported.dump,
        bitcoinKey: imported.bitcoinKey ? {
          publicKeyCompressedHex: imported.bitcoinKey.publicKeyCompressedHex,
          userXonly32: imported.bitcoinKey.userXonly32,
          matchesCsvUserKey: imported.bitcoinKey.matchesCsvUserKey
        } : null,
        csvCandidates: imported.csvCandidates,
        manual: imported.manual,
        missing: imported.missing
      },
      null,
      2
    );
    elements.utxoOutput.value = imported.utxoText;
    elements.bitcoinAddress.value = formatCandidateAddresses(imported.csvCandidates);
    elements.bitcoinPrivateKey.value = imported.bitcoinKey ? `${imported.bitcoinKey.privateKeyHex}
WIF: ${imported.bitcoinKey.privateKeyWif}
Matches CSV user key: ${imported.bitcoinKey.matchesCsvUserKey ? "yes" : "no"}` : "not available in dump";
    elements.bitcoinPublicKey.value = imported.bitcoinKey ? `${imported.bitcoinKey.publicKeyCompressedHex}
${imported.bitcoinKey.userXonly32}` : "not available in dump";
    elements.ethereumAddress.value = "not available from this Bitcoin dump";
    elements.ethereumPrivateKey.value = "not available from this Bitcoin dump";
    elements.ethereumPublicKey.value = "not available from this Bitcoin dump";
    elements.exportJson.value = JSON.stringify(imported, null, 2);
  }
  async function renderOutputs(result) {
    const bitcoin = deriveBitcoinKeypair(result.prf);
    const ethereum = deriveEthereumKeypair(result.prf);
    const credentialId = bytesToBase64url(arrayBufferToBytes(result.credential.rawId));
    const recovery = await buildRecoveryContext({ bitcoin, credentialId });
    const exportData = {
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      origin: window.location.origin,
      rpId: NURI_RP_ID,
      prfInput: {
        text: NURI_PRF_INPUT,
        utf8Hex: bytesToHex3(utf82(NURI_PRF_INPUT))
      },
      recoveryMode: result.mode,
      credential: {
        id: result.credential.id,
        rawId: credentialId,
        type: result.credential.type,
        authenticatorAttachment: result.credential.authenticatorAttachment || null
      },
      prf: {
        firstHex: bytesToHex3(result.prf),
        firstBase64url: bytesToBase64url(result.prf)
      },
      bitcoin,
      ethereum,
      recovery
    };
    elements.metadataStatus.textContent = recovery.statusText;
    elements.recoveryOutput.value = JSON.stringify(
      {
        serverKeys: recovery.serverKeys,
        legacyCsvCandidates: recovery.legacyCsvCandidates,
        dumpCsvCandidates: recovery.dumpCsvCandidates,
        manual: recovery.manual,
        missing: recovery.missing,
        metadataAttempts: recovery.metadata.attempts || []
      },
      null,
      2
    );
    elements.utxoOutput.value = recovery.utxoText;
    elements.bitcoinAddress.value = bitcoin.address;
    elements.bitcoinPrivateKey.value = bitcoin.privateKeyHex;
    elements.bitcoinPublicKey.value = bitcoin.publicKeyCompressedHex;
    elements.ethereumAddress.value = ethereum.address;
    elements.ethereumPrivateKey.value = ethereum.privateKeyHex;
    elements.ethereumPublicKey.value = ethereum.publicKeyUncompressedHex;
    elements.exportJson.value = JSON.stringify(exportData, null, 2);
  }
  async function recover() {
    elements.recoverButton.disabled = true;
    elements.importDumpButton.disabled = true;
    clearOutputs();
    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.get) {
        throw new Error("This browser does not expose WebAuthn credentials.get().");
      }
      if (!window.isSecureContext) {
        throw new Error("WebAuthn requires the trusted https://nuri.com local origin.");
      }
      const result = await recoverPrf();
      setMessage("Recovered keypairs. Looking up server metadata and UTXOs...", "neutral");
      await renderOutputs(result);
      setMessage("Recovered keypairs and checked available recovery metadata.", "success");
    } catch (error) {
      setMessage(error.message || String(error), "error");
    } finally {
      elements.recoverButton.disabled = false;
      elements.importDumpButton.disabled = false;
    }
  }
  async function importDump() {
    elements.recoverButton.disabled = true;
    elements.importDumpButton.disabled = true;
    clearOutputs();
    try {
      setMessage("Importing dump and checking UTXOs...", "neutral");
      const imported = await buildDumpImportContext();
      renderDumpImportOutputs(imported);
      setMessage("Imported dump and checked CSV UTXO status.", "success");
    } catch (error) {
      setMessage(error.message || String(error), "error");
    } finally {
      elements.recoverButton.disabled = false;
      elements.importDumpButton.disabled = false;
    }
  }
  function updateOriginStatus() {
    const hostMatches = window.location.hostname === NURI_RP_ID || window.location.hostname.endsWith(`.${NURI_RP_ID}`);
    const secure = window.isSecureContext && window.location.protocol === "https:";
    if (hostMatches && secure) {
      setOriginStatus(`Ready on ${window.location.origin}`, "success");
      return;
    }
    setOriginStatus(`Open https://${NURI_RP_ID}:8443 to recover`, "error");
  }
  elements.recoverButton.addEventListener("click", recover);
  elements.importDumpButton.addEventListener("click", importDump);
  updateOriginStatus();
})();
/*! Bundled license information:

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/weierstrass.js:
@noble/curves/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/bip32/index.js:
  (*! scure-bip32 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) *)
*/
