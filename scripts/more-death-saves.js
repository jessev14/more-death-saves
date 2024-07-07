const moduleID = 'more-death-saves';

const lg = x => console.log(x);

Hooks.once('setup', () => {
    game.i18n.translations.DND5E.DeathSaveSuccess = `{name} has survived with 5 death save successes and is now stable!`;
    game.i18n.translations.DND5E.DeathSaveFailure = `{name} has died with 5 death save failures!`;
});

Hooks.once("ready", () => {
    libWrapper.register(moduleID, 'dnd5e.applications.actor.ActorSheet5eCharacter2.prototype.getData', moreDeathSaveGetData, 'WRAPPER');
    libWrapper.register(moduleID, 'dnd5e.documents.Actor5e.prototype.rollDeathSave', newRollDeathSave, 'WRAPPER');
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

async function newRollDeathSave(wrapped, options = {}) {
    const death = this.system.attributes.death;
    death.success = death.success - 2;
    death.failure = death.failure - 2;

    Hooks.once('dnd5e.rollDeathSave', (actor, roll, details) => {
        death.success = death.success + 2;
        death.failure = death.failure + 2;

        const isCritSuccess = details.chatString === 'DND5E.DeathSaveCriticalSuccess';
        if (isCritSuccess) return true;

        const isSurvive = details.chatString === 'DND5E.DeathSaveSuccess';
        if (isSurvive) return true;

        const isSuccess = 'system.attributes.death.success' in details.updates;
        if (isSuccess) {
            details.updates['system.attributes.death.success'] = Math.clamp(death.success + 1, 0, 5);
            return true;
        }

        const isDeath = details.chatString === 'DND5E.DeathSaveFailure';
        if (isDeath) {
            details.updates['system.attributes.death.failure'] = 5;
            return true;
        }

        const isFailure = 'system.attributes.death.failure' in details.updates;
        if (isFailure) {
            details.updates['system.attributes.death.failure'] = Math.clamp(death.failure + (roll.isFumble ? 2 : 1), 0, 5);
            return true;
        }
    });
    await wrapped(options);
}
