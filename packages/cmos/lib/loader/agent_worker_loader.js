/**
 * AgentWorkerLoader 类，继承 BaseLoader，实现整个应用的加载机制
 */

'use strict';

const CmosLoader = require('cmos-core').CmosLoader;

/**
 * Agent Worker 进程的 Loader，继承 cmos-loader
 */
class AgentWorkerLoader extends CmosLoader {

  /**
   * loadPlugin first, then loadConfig
   */
  loadConfig() {
    super.loadPlugin();
    super.loadConfig();
  }

  load() {
    this.loadAgentExtend();
    this.loadCustomAgent();
  }
}

module.exports = AgentWorkerLoader;
