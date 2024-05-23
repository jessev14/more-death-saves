const moduleID = 'more-death-saves';

const lg = x => console.log(x);


Hooks.once("ready", () => {
    libWrapper.register(moduleID, "dnd5e.applications.actor.ActorSheet5eCharacter2.prototype.getData", moreDeathSaveGetData, 'WRAPPER');
});


async function moreDeathSaveGetData(wrapped, ...args) {
    const context = await wrapped(...args);

    const { attributes } = this.actor.system;

    const plurals = new Intl.PluralRules(game.i18n.lang, { type: "ordinal" });
    context.death = { open: this._deathTrayOpen };
    ["success", "failure"].forEach(deathSave => {
        context.death[deathSave] = [];
        for (let i = 1; i < 6; i++) {
            const n = deathSave === "failure" ? i : 6 - i;
            const i18nKey = `DND5E.DeathSave${deathSave.titleCase()}Label`;
            const filled = attributes.death[deathSave] >= n;
            const classes = ["pip"];
            if (filled) classes.push("filled");
            if (deathSave === "failure") classes.push("failure");
            context.death[deathSave].push({
                n, filled,
                tooltip: i18nKey,
                label: game.i18n.localize(`${i18nKey}N.${plurals.select(n)}`),
                classes: classes.join(" ")
            });
        }
    });

    return context;
}
