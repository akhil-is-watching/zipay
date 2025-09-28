// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MajorModule = buildModule("MajorModule", (m) => {

  const permit2 = m.getParameter("permit2", "0x000000000022D473030F116dDEE9F6B43aC78BA3");


  const implementation = m.contract("HTLCEscrow", [],);
  const factory = m.contract("HTLCEscrowFactory", [implementation],);
  const settlementEngine = m.contract("SettlementEngine", [factory, permit2],);

  return { implementation, factory, settlementEngine };
});

export default MajorModule;
