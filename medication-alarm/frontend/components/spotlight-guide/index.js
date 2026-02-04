// components/spotlight-guide/index.js
Component({
  properties: {
    run: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.startGuide();
        } else {
          this.setData({ visible: false });
        }
      }
    },
    steps: {
      type: Array,
      value: [] // [{ target: '#id', content: 'text', placement: 'bottom' }]
    },
    stepIndex: {
      type: Number,
      value: 0,
      observer(newVal) {
          if (this.data.run) {
              this.startGuide();
          }
      }
    }
  },

  data: {
    visible: false,
    targetRect: { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 },
    tooltipTop: 0,
    tooltipLeft: 0,
    tooltipPosition: 'bottom',
    content: '',
    noNext: false
  },

  methods: {
    preventTouchMove() {
      // Block scrolling while guide is active
    },

    startGuide() {
      const step = this.data.steps[this.data.stepIndex];
      if (!step) {
        this.setData({ visible: false });
        this.triggerEvent('complete');
        return;
      }

      this.setData({ 
          content: step.content,
          noNext: step.noNext || false 
      });
      
      const query = wx.createSelectorQuery().in(this.getPageId() || this); 
      // Note: If targeting page elements from component, we might need a different approach.
      // But usually wx.createSelectorQuery() works if we don't specify .in(this) for global selection.
      // Actually, in components, createSelectorQuery() is scoped to the component by default if used as this.createSelectorQuery().
      // wx.createSelectorQuery() is global.
      
      wx.createSelectorQuery().select(step.target).boundingClientRect(rect => {
        if (!rect) {
          console.warn(`Spotlight: Target ${step.target} not found`);
          // Retry once? Or just skip?
          // If target is not rendered yet, this fails.
          return;
        }

        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth;
        // const screenHeight = systemInfo.windowHeight;

        // Tooltip positioning
        let tooltipTop = 0;
        let tooltipLeft = rect.left + (rect.width / 2) - 120; // Center (width 240)
        let position = step.placement || 'bottom';

        // Clamp left
        if (tooltipLeft < 10) tooltipLeft = 10;
        if (tooltipLeft + 240 > screenWidth - 10) tooltipLeft = screenWidth - 250;

        if (position === 'bottom') {
          tooltipTop = rect.bottom + 12;
        } else {
          tooltipTop = rect.top - 120; // Move up
        }

        this.setData({
          visible: true,
          targetRect: {
            ...rect,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height
          },
          tooltipTop,
          tooltipLeft,
          tooltipPosition: position
        });

      }).exec();
    },

    onNext() {
        this.triggerEvent('next');
    },
    
    getPageId() {
        return null; 
    },

    setStep(step) {
      if (!step) {
        this.dismiss();
        return;
      }
      this.setData({ 
          content: step.content,
          noNext: step.noNext || false 
      });
      
      // Use global selector to find target on page
      wx.createSelectorQuery().select(step.target).boundingClientRect(rect => {
        if (!rect) {
          console.warn(`Spotlight: Target ${step.target} not found`);
          return;
        }

        const systemInfo = wx.getSystemInfoSync();
        const screenWidth = systemInfo.windowWidth;

        // Tooltip positioning
        let tooltipTop = 0;
        let tooltipLeft = rect.left + (rect.width / 2) - 120; // Center (width 240)
        let position = step.position || step.placement || 'bottom';

        // Clamp left
        if (tooltipLeft < 10) tooltipLeft = 10;
        if (tooltipLeft + 240 > screenWidth - 10) tooltipLeft = screenWidth - 250;

        if (position === 'bottom') {
          tooltipTop = rect.bottom + 12;
        } else {
          // Adjust for top placement
          tooltipTop = rect.top - 100; 
          if (tooltipTop < 0) tooltipTop = 10; 
        }

        this.setData({
          visible: true,
          targetRect: {
            ...rect,
            right: rect.left + rect.width,
            bottom: rect.top + rect.height
          },
          tooltipTop,
          tooltipLeft,
          tooltipPosition: position
        });
      }).exec();
    },

    dismiss() {
      this.setData({ visible: false });
      this.triggerEvent('complete');
    },

    doNothing() {}
  }
});
