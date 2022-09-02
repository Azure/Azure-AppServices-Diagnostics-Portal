var isReplacementString = (inputStr) => {
	return (inputStr.match(/<!--[a-z0-9\-]+-->/) != null);
}

var sectionParser = (content: string) => {
	var headingSplits = content.split(/(<h[1-9]>.*<\/h[1-9]>)/);
	var nonEmptyParts = headingSplits.filter(x => x.length > 1);
	var sections: string[] = [];
    if (nonEmptyParts && nonEmptyParts.length > 0) {
        for (var i=0; i<nonEmptyParts.length; i++) {
            if (/<h[1-9]>.*<\/h[1-9]>/.test(nonEmptyParts[i])) {
                sections.push(nonEmptyParts[i] + nonEmptyParts[i+1]);
                i++;
            }
        }
    }
	return sections;
}

export var cleanApolloSolutions = (docContent) => {
	var sections = sectionParser(docContent);
	var targetParts = sections.filter((x:string) => x.length > 1 && !isReplacementString(x));
	targetParts = targetParts[0].includes("<h2>") || !targetParts[0].includes("a href") ? targetParts.slice(1, targetParts.length): targetParts;
	return targetParts ? targetParts.join('\n'): '';
}