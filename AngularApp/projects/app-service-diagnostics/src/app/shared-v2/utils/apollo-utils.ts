var isReplacementString = (inputStr) => {
	return (inputStr.match(/<!--[a-z0-9\-]+-->/) != null);
}

var sectionParser = (content: string) => {
	//Split on lines with header tag
	var headingSplits = content.split(/(<h[1-9]>.*<\/h[1-9]>)/);
	var nonEmptyParts = headingSplits.filter(x => x.length > 0);
	var sections: string[] = [];

	//Create sections from the splits
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

export var cleanApolloSolutions = (docContent, returnAllContent:boolean) => {
	var sections = sectionParser(docContent);
	//Remove sections which have Apollo replacement string
	var targetParts = sections.filter((x:string) => x.length > 1 && !isReplacementString(x));

	//Also remove the FIRST SECTION if it has h2 tag or if it doesn't contain any links only if the returnAllContent flag is false
	if(!returnAllContent) {
		targetParts = (returnAllContent && targetParts[0].includes("<h2>")) || !targetParts[0].includes("a href") ? targetParts.slice(1, targetParts.length): targetParts;
	}
	
	let result = targetParts ? targetParts.join('\n'): '';
	const hrefTerm = "a href";
	const searchRegExp = new RegExp(hrefTerm, 'g');
	result = result.replace(searchRegExp, 'a target="_blank" href');
	return result;
}