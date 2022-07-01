// // Reach js standard library loader
// import { loadStdlib } from '@reach-sh/stdlib';
// // JS backend compiled from `index.rsh`
// import * as backend from './build/index.main.mjs';
// // ask for input
// import { ask } from '@reach-sh/stdlib';

// // Load Reach.js stdlib for the consensus network
// // specified by REACH_CONNECTOR_MODE env var
// const stdlib = loadStdlib(process.env);

// // display consensus network type
// console.log(`The consensus network is ${stdlib.connector}`);

// // hard code role
// const role = process.argv[2];
// console.log(`Your role is ${role}`);

// const suStr = stdlib.standardUnit; // standard unit currency
// const auStr = stdlib.atomicUnit;   // atomic unit currency

// // currency conversion
// const toAU = (su) => stdlib.parseCurrency(su);
// const toSU = (au) => stdlib.formatCurrency(au, 4);

// const iBalance = toAU(1000); // initial balance
// const showBalance = async (acc) => console.log(`Your Balance Is: ${toSU(await stdlib.balanceOf(acc))} ${suStr}`);

// const commonInteract = (role) => ({
//     reportCancellation: () => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} cancelled the order.`); }
// });

// if (process.argv.length < 3 || ['seller', 'buyer'].includes(process.argv[2]) == false) {
//     console.log(`Usage: reach run index.js [seller|buyer]`);
//     process.exit(0);
// };

// // seller
// if (role == 'seller') {
//     const sellerInteract = {
//         ...commonInteract(role),
//         price: toAU(5),
//         reportReady: async (price) => {
//             console.log(),
//             console.log(`Wisdom for sale at ${toSU(price)} ${suStr}.`);
//             console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
//         },
//     };
//     // create account for seller
//     const acc = await stdlib.newTestAccount(iBalance);

//     await showBalance(acc);
//     // create a contract reference
//     const ctc = acc.contract(backend);

//     // initiate interaction with the contract for seller
//     await ctc.participants.Seller(sellerInteract);
//     await showBalance(acc);
// } else {
//     const buyerInteract = {
//         ...commonInteract(role),
//         confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toSU(price)} ${suStr}?`, ask.yesno),
//     };
//     const acc = await stdlib.newTestAccount(iBalance);
//     const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
//     const ctc = acc.contract(backend, info);
//     await showBalance(acc);
//     await ctc.p.Buyer(buyerInteract);
//     await showBalance(acc);
// }

// ask.done();

import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask } from '@reach-sh/stdlib';

if (process.argv.length < 3 || ['seller', 'buyer'].includes(process.argv[2]) == false) {
    console.log('Usage: reach run index [seller|buyer]');
    process.exit(0);
}
const role = process.argv[2];
console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
console.log(`The consensus network is ${stdlib.connector}.`);
const suStr = stdlib.standardUnit;
const toAU = (su) => stdlib.parseCurrency(su);
const toSU = (au) => stdlib.formatCurrency(au, 4);
const iBalance = toAU(1000);
const showBalance = async (acc) => console.log(`Your balance is ${toSU(await stdlib.balanceOf(acc))} ${suStr}.`);

const commonInteract = (role) => ({
    reportCancellation: () => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} cancelled the order.`); },
    reportPayment: (payment) => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} paid ${toSU(payment)} ${suStr} to the contract.`) },
    reportTransfer: (payment) => { console.log(`The contract paid ${toSU(payment)} ${suStr} to ${role == 'seller' ? 'you' : 'the seller'}.`) }
});

// Seller
if (role === 'seller') {
    const sellerInteract = {
        ...commonInteract(role),
        price: toAU(5),
        wisdom: await ask.ask('Enter a wise phrase, or press Enter for default:', (s) => {
            let w = !s ? 'Build healthy communities.' : s;
            if (!s) { console.log(w); }
            return w;
        }),
        reportReady: async (price) => {
            console.log(`Your wisdom is for sale at ${toSU(price)} ${suStr}.`);
            console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
        },
    };

    const acc = await stdlib.newTestAccount(iBalance);
    await showBalance(acc);
    const ctc = acc.contract(backend);
    await ctc.participants.Seller(sellerInteract);
    await showBalance(acc);

    // Buyer
} else {
    const buyerInteract = {
        ...commonInteract(role),
        confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toSU(price)} ${suStr}?`, ask.yesno),
        reportWisdom: (wisdom) => console.log(`Your new wisdom is "${wisdom}"`),
    };

    const acc = await stdlib.newTestAccount(iBalance);
    const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
    const ctc = acc.contract(backend, info);
    const price = await ctc.views.Main.price();
    console.log(`The price of wisdom is ${price[0] == 'None' ? '0' : toSU(price[1])} ${suStr}.`);
    await showBalance(acc);
    await ctc.p.Buyer(buyerInteract);
    await showBalance(acc);
};

ask.done();