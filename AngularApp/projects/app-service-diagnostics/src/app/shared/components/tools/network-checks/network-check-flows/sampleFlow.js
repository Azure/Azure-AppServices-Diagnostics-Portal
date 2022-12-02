import {
  DropdownStepView,
  InfoStepView,
  StepFlow,
  StepFlowManager,
  CheckStepView,
  StepViewContainer,
  InputStepView,
  ButtonStepView,
  PromiseCompletionSource,
  TelemetryService
} from 'diagnostic-data';

function delay(second) {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

export var sampleFlow = {
  id: 'sampleFlow',
  title: 'Sample Flow',
  async func(siteInfo, diagProvider, flowMgr) {
    // CheckStepView sample
    var check1 = new CheckStepView({
      title: 'check 1',
      level: 0,
      subChecks: [
        {
          title: 'check2',
          level: 1,
          subChecks: [
            {
              title: 'check3',
              level: 2,
              subChecks: null,
              detailsMarkdown: `Check without subchecks can have detailsMarkdown as a detail button and will trigger a side bar`
            }
          ],
          detailsMarkdown: `detailsMarkdown in check which subChecks is not null will be ignored`
        }
      ]
    });
    flowMgr.addView(check1);

    // InfoStepView sample
    var markdown =
      `
You can use most of the markdown syntax here, such as
# title
1. bullet 1
2. bullet 2
- bullet 3
- bullet 4

[hyperlink](https://www.microsoft.com)

## table
| column1 | column2 |
| ------- | ------- |
| value1  | value2  | 
` +
      '\r\n```\r\n' +
      `code line1
code line2` +
      '\r\n```\r\n';
    flowMgr.addView(
      new InfoStepView({
        infoType: 1,
        title: 'InfoStepView sample',
        markdown: markdown
      })
    );

    // ButtonStepView sample
    flowMgr.addView(
      new ButtonStepView({
        callback: () => {
          alert(
            'call back function of button, button will be hidden after clicked'
          );
        },
        text: 'Test'
      })
    );

    // InputStepView sample
    flowMgr.addView(
      new InputStepView({
        title: 'title',
        placeholder: 'place holder',
        buttonText: 'test',
        entry: 'Input name',
        text: '',
        tooltip: 'tooltip',
        error: null,
        collapsed: false,
        async callback(userInput) {
          alert(`your input is ${userInput}`);
        }
      })
    );

    // DropwdownStepView sample
    flowMgr.addView(
      new DropdownStepView({
        dropdowns: [
          {
            description: 'dropdown 0',
            options: ['option 0', 'option 1']
          },
          {
            description: 'dropdown 1',
            options: ['option 0', 'option 1']
          },
          {
            description: 'dropdown 2',
            options: [],
            placeholder: 'placeholder'
          }
        ],
        width: '60%',
        bordered: true,
        description: 'title',
        async callback(dropdownIdx, selectedIdx) {
          alert(`dropdown ${dropdownIdx} option ${selectedIdx} is selected`);
        }
      })
    );

    // promise of view sample
    flowMgr.addView(GetDelayedView(), 'loading delayed view');
  }
};

async function GetDelayedView() {
  await delay(10);
  var markdown =
    'You can pass a promise of the stepView object to `flowMgr.addView(promise[, "loading message"])` to render a loading icon before the promise is completed.';
  var view = new InfoStepView({
    infoType: 1,
    title: 'Delayed loading with loading icon',
    markdown: markdown
  });
  return view;
}
