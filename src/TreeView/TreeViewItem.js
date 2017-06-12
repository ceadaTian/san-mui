/**
 * @file TreeViewItem
 * @author Lu Yuan(luyuan.china@gmail.com)
 */

import san from 'san';
import {TouchRipple} from '../Ripple';
import Icon from '../Icon';
import {Highlight} from './highlight';

export default san.defineComponent({

    template: `
        <div class="sm-tree-view-item {{treeViewItemClass}} {{selectedClass}}"
            on-click="toggleTreeView($event)"
            style="{{itemStyle}}"
        >
            <san-touch-ripple san-if="!disableRipple && !disabled"
                style="{{touchRippleStyle}}"
                class="{{selectedClass}} {{hiddenClass}}"
            ></san-touch-ripple>
            <div class="sm-tree-view-item-content {{selectedClass}}
                        {{hiddenClass}}"
                style="{{itemContentStyle}}"
                on-mouseenterq="handleMouseEnter($event)"
                on-mouseleave1="handleMouseLeave($event)"
            >
                <div class="sm-tree-view-item-left">
                    <slot name="left"></slot>
                </div>
                <p class="sm-tree-view-item-primary-text" 
                    san-if="primaryText"
                >{{ primaryText }}</p>
                <p class="sm-tree-view-item-secondary-text" 
                    style="{{secondaryTextStyle}}" 
                    san-if="secondaryText"
                >{{ secondaryText | raw }}</p>
                <div class="sm-tree-view-item-right" san-if="!toggleNested">
                    <slot name="right"></slot>
                </div>
            </div>
            <div
                class="sm-tree-view-item-expand {{selectedClass}}
                       {{hiddenClass}}" 
                san-if="toggleNested" 
                on-click="toggleTreeView($event, 'EXPAND', false, true)"
                style="{{expandStyle}}"
            >
                <san-icon>arrow_drop_{{ open | treeViewOpenIcon }}</san-icon>
                <san-center-ripple />
            </div>
            <div class="sm-tree-view-item-nested {{ open | treeViewOpen }}"
                style="{{nestedTreeViewStyle}}"
            >
                <slot name="nested"></slot>
            </div>
        </div>
    `,

    defaultData() {
        return {
            disabled: false,
            hidden: false,
            selected: false,
            disableRipple: false,
            primaryTogglesNestedTreeView: true,
            initiallyOpen: false
        };
    },

    components: {
        'san-touch-ripple': TouchRipple,
        'san-icon': Icon
    },

    messages: {
        'UI:nested-counter'(arg) {
            let target = arg.value;
            target.set('nestedLevel', target.get('nestedLevel') + 1);
            this.dispatch('UI:nested-counter', target);
        },
        'UI:tree-view-item-hidden'(arg) {
            let childHidden = arg.value;
            this.data.set('hidden', childHidden && this.data.get('hidden'));
        },
        'UI:expand-parent-tree-view-item'(arg) {
            if (typeof arg.value === 'object') {
                if (arg.value.old === ''
                    && this.data.get('lastExpandingState') === null) {
                    this.data.set('lastExpandingState', this.data.get('open'));
                }
            }
            this.toggleTreeView(document.createEvent('MouseEvent'), '',
                true, false);
        },
        'UI:tree-view-item-attached'(arg) {
            this.data.set('children', this.data.get('children') + 1);
            this.dispatch('UI:tree-view-item-attached', arg.value);
        },
        'UI:tree-view-item-detached'(arg) {
            this.data && this.data.set(
                'children', this.data.get('children') - 1);
            this.dispatch('UI:tree-view-item-detached', arg.value);
        }
    },

    initData() {
        return {
            nestedLevel: 1,
            children: 0,
            secondaryTextLines: 1,
            lastExpandingState: null
        };
    },

    filters: {
        treeViewOpenIcon(open) {
            return open ? 'down' : 'up';
        },
        treeViewOpen(open) {
            return open ? '' : 'hide';
        }
    },

    computed: {
        itemStyle() {
            return {
                'margin-left': this.data.get('nestedLevel') === 1
                    ? 0
                    : this.data.get('rippleMarginLeft') + 'px'
            };
        },
        itemContentStyle() {
            let paddingLeftHasLeft =
                this.data.get('compact') ? '32px' : '64px';
            let paddingLeftWithoutLeft =
                this.data.get('compact') ? '6px' : '16px';
            return {
                'margin-left': this.data.get('contentMarginLeft') + 'px',
                'padding-left': this.data.get('hasLeft')
                    ? paddingLeftHasLeft
                    : paddingLeftWithoutLeft
            };
        },
        expandStyle() {
            return {
                'transform': this.data.get('open') ? 'rotate(0)' : 'rotate(90deg)'
            }
        },
        touchRippleStyle() {
            let level = this.data.get('nestedLevel');
            let leftNormal = this.data.get('wholeLineSelected')
                ? ((1 - level) * this.data.get('rippleMarginLeft'))
                : this.data.get('contentMarginLeft');
            let leftCompact = this.data.get('wholeLineSelected')
                ? ((1 - level) * this.data.get('rippleMarginLeft'))
                : this.data.get('contentMarginLeft');
            if (!leftNormal || !leftCompact) {
                return;
            }

            return {
                'left': this.data.get('compact')
                    ? leftCompact + 'px'
                    : leftNormal + 'px'
            }
        },
        selectedClass() {
            return this.data.get('selected') ? 'selected': '';
        },
        hiddenClass() {
            return this.data.get('hidden') ? 'hidden' : '';
        },
        treeViewItemClass() {
            return (this.data.get('disabled') ? 'disabled ' : '')
                + (this.data.get('toggleNested') ? 'nested ' : '')
                + (this.data.get('compact') ? 'compact' : '');
        },
        secondaryTextStyle() {
            return {
                '-webkit-line-clamp': this.data.get('secondaryTextLines')
            }
        }
    },

    inited() {
        this.transBoolean('disabled');
        this.transBoolean('hidden');
        this.transBoolean('toggleNested');
        this.transBoolean('disableRipple');
        this.transBoolean('primaryTogglesNestedTreeView');
        this.transBoolean('initiallyOpen');
        this.data.set('open', this.data.get('initiallyOpen'));

        this.dispatch('UI:nested-counter', this.data);

        this.dispatch('UI:query-compact-attribute');
        this.dispatch('UI:query-whole-line-selected-attribute');
        this.dispatch('UI:query-keeping-selected-attribute');
    },

    attached() {
        let slotChilds = this.slotChilds;
        let hasLeft = 1;

        for (let slot of slotChilds) {
            if (slot.name === 'left' || slot.name === 'leftAvatar') {
                hasLeft--;
            }
        }

        this.data.set('hasLeft', hasLeft > 0);

        this.watch('selected', (value) => {
            this.fire('selectedToggle', value);
        });
        this.watch('hidden', (value) => {
            this.fire('hiddenToggle', value);
        });

        this.dispatch('UI:tree-view-item-attached', this);
    },

    detached() {
        this.dispatch('UI:tree-view-item-detached', this);
    },

    toggleTreeView(evt, driver, forceOpen = false, forceSelected = true) {
        evt.stopPropagation();

        if (this.data.get('disabled')) {
            return;
        }
        (driver === 'EXPAND' || forceSelected) && this.toggleRipple();
        if (driver !== 'EXPAND' && !forceOpen
                && !this.data.get('primaryTogglesNestedTreeView')) {
            return;
        }

        let open = this.data.get('open');
        this.data.set('open', forceOpen ? true : !open);

        this.fire('nestedTreeViewToggle', open);
    },

    clearSelectedClass(send) {
        (this.data.get('selected') === true)
            && this.data.set('selected', false);
        send && this.dispatch('UI:clear-selected-item');
    },

    toggleRipple() {
        if (this.data.get('keepingSelected')) {
            if (this.data.get('selected')
                && !this.data.get('primaryTogglesNestedTreeView')) {
                return;
            }
            this.clearSelectedClass(true);
            this.data.set('selected', true);
            this.dispatch('UI:record-selected-item');
        }
    },

    highlight(word, input, backColor = 'coral', foreColor = 'white') {
        let el = this.el;
        if (!el) {
            return;
        }
        let contentSelector = '.sm-tree-view-item-content';
        let primaryTextSelector = 'p.sm-tree-view-item-primary-text';
        let secondaryTextSelector = 'p.sm-tree-view-item-secondary-text';
        let primary =
            el.querySelector(contentSelector + '>' + primaryTextSelector);
        let secondary =
            el.querySelector(contentSelector + '>' + secondaryTextSelector);

        if (typeof word === 'string' && word !== '') {
            Highlight.highlight(primary, word, input, backColor, foreColor);
            Highlight.highlight(secondary, word, input, backColor, foreColor);
        } else {
            Highlight.unhighlight(primary, input);
            Highlight.unhighlight(secondary, input);
        }
    },

    transBoolean(key) {
        let value = this.data.get(key);
        this.data.set(key, value !== undefined);
    }
});