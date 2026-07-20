/**
 * allocation.js
 * Core disk + file allocation strategy logic, shared by the API layer.
 */

class Disk {
  constructor(size = 40) {
    this.size = size;
    this.blocks = new Array(size).fill(null); // null = free, else owner label
  }

  reset(size) {
    this.size = size;
    this.blocks = new Array(size).fill(null);
  }

  freeBlockIndices() {
    const free = [];
    for (let i = 0; i < this.size; i++) if (this.blocks[i] === null) free.push(i);
    return free;
  }

  freeContiguousRun(length) {
    let runStart = -1;
    let runLen = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.blocks[i] === null) {
        if (runLen === 0) runStart = i;
        runLen++;
        if (runLen === length) return runStart;
      } else {
        runLen = 0;
        runStart = -1;
      }
    }
    return -1;
  }

  occupy(indices, label) {
    indices.forEach((i) => (this.blocks[i] = label));
  }

  release(indices) {
    indices.forEach((i) => (this.blocks[i] = null));
  }

  serialize() {
    return {
      size: this.size,
      blocks: this.blocks.map((owner) => owner), // null or label string
      freeCount: this.freeBlockIndices().length,
    };
  }
}

class AllocationStrategy {
  constructor(disk) {
    this.disk = disk;
    this.files = new Map();
  }

  fileExists(name) {
    return this.files.has(name);
  }

  reset() {
    this.files.clear();
  }

  listFiles() {
    return [...this.files.entries()].map(([name, meta]) => this.describe(name, meta));
  }
}

class SequentialAllocation extends AllocationStrategy {
  allocate(name, numBlocks) {
    if (this.fileExists(name)) return { ok: false, message: `File "${name}" already exists.` };
    const start = this.disk.freeContiguousRun(numBlocks);
    if (start === -1) {
      return {
        ok: false,
        message: `No contiguous run of ${numBlocks} free blocks available (fragmentation).`,
      };
    }
    const indices = Array.from({ length: numBlocks }, (_, i) => start + i);
    this.disk.occupy(indices, name);
    this.files.set(name, { start, length: numBlocks, indices });
    return { ok: true, message: `Allocated "${name}" at blocks [${indices.join(',')}].` };
  }

  delete(name) {
    if (!this.fileExists(name)) return { ok: false, message: `File "${name}" not found.` };
    const { indices } = this.files.get(name);
    this.disk.release(indices);
    this.files.delete(name);
    return { ok: true, message: `Deleted "${name}".` };
  }

  describe(name, meta) {
    return { name, method: 'sequential', start: meta.start, length: meta.length, blocks: meta.indices };
  }
}

class LinkedAllocation extends AllocationStrategy {
  constructor(disk) {
    super(disk);
    this.next = new Map();
  }

  allocate(name, numBlocks) {
    if (this.fileExists(name)) return { ok: false, message: `File "${name}" already exists.` };
    const free = this.disk.freeBlockIndices();
    if (free.length < numBlocks) {
      return { ok: false, message: `Need ${numBlocks} blocks, only ${free.length} free.` };
    }
    const chosen = free.slice(0, numBlocks);
    this.disk.occupy(chosen, name);
    for (let i = 0; i < chosen.length; i++) {
      this.next.set(chosen[i], i + 1 < chosen.length ? chosen[i + 1] : -1);
    }
    this.files.set(name, { start: chosen[0], blocks: chosen });
    return { ok: true, message: `Allocated "${name}" as linked chain from block ${chosen[0]}.` };
  }

  delete(name) {
    if (!this.fileExists(name)) return { ok: false, message: `File "${name}" not found.` };
    const { blocks } = this.files.get(name);
    blocks.forEach((b) => this.next.delete(b));
    this.disk.release(blocks);
    this.files.delete(name);
    return { ok: true, message: `Deleted "${name}".` };
  }

  describe(name, meta) {
    const chain = meta.blocks.map((b) => ({ block: b, next: this.next.get(b) }));
    return { name, method: 'linked', start: meta.start, blocks: meta.blocks, chain };
  }
}

class IndexedAllocation extends AllocationStrategy {
  allocate(name, numBlocks) {
    if (this.fileExists(name)) return { ok: false, message: `File "${name}" already exists.` };
    const free = this.disk.freeBlockIndices();
    if (free.length < numBlocks + 1) {
      return {
        ok: false,
        message: `Need ${numBlocks + 1} blocks (incl. 1 index block), only ${free.length} free.`,
      };
    }
    const indexBlock = free[0];
    const dataBlocks = free.slice(1, 1 + numBlocks);
    this.disk.occupy([indexBlock], `${name}#idx`);
    this.disk.occupy(dataBlocks, name);
    this.files.set(name, { indexBlock, dataBlocks });
    return {
      ok: true,
      message: `Allocated "${name}": index block ${indexBlock} -> data [${dataBlocks.join(',')}].`,
    };
  }

  delete(name) {
    if (!this.fileExists(name)) return { ok: false, message: `File "${name}" not found.` };
    const { indexBlock, dataBlocks } = this.files.get(name);
    this.disk.release([indexBlock, ...dataBlocks]);
    this.files.delete(name);
    return { ok: true, message: `Deleted "${name}".` };
  }

  describe(name, meta) {
    return { name, method: 'indexed', indexBlock: meta.indexBlock, blocks: meta.dataBlocks };
  }
}

function createStrategy(method, disk) {
  if (method === 'linked') return new LinkedAllocation(disk);
  if (method === 'indexed') return new IndexedAllocation(disk);
  return new SequentialAllocation(disk);
}

module.exports = { Disk, SequentialAllocation, LinkedAllocation, IndexedAllocation, createStrategy };
